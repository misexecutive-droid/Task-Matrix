// Ticket = the Mongoose model that maps to the "tickets" collection in MongoDB. It defines what fields a ticket has (title, status, assigneeId, etc).
import { Ticket } from "../../models/Ticket.js"
// AppError = a custom error class we throw to represent "expected" errors like 404 Not Found or 403 Forbidden, with a status code baked in, so the error middleware can turn it into the right HTTP response.
import { AppError } from "../../utils/AppError.js"
// Type-only import: describes what's inside a decoded JWT access token (the logged-in user's id, role, department, store, etc). `type` import means it's erased at compile time - no runtime code.
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
// Type-only imports for the shapes of data allowed when creating/updating a ticket (inferred from the Zod schemas in ticket.validation.ts).
import type { CreateTicketInput, UpdateTicketInput } from "./ticket.validation.js"
// Service that writes an audit trail entry any time a ticket is created/updated/deleted, so there's a history of who changed what.
import { auditService } from "../audit/audit.service.js"
// Helper that emits a real-time event over Socket.IO (or similar) so connected clients can update their UI live (e.g. "a new ticket showed up") without needing to refresh/poll.
import { emitTicketEvent } from "../../sockets/ticketEvent.js"
// Service responsible for creating notifications (e.g. "you were assigned a ticket") for users.
import { notificationService } from "../notifications/notification.service.js"

// Small helper that takes a Mongoose query (not yet executed) and attaches `.populate()` calls to it.
// By default, fields like `assignee` or `raisedBy` are just stored as raw ObjectId references in the database (pointers to a User document).
// `.populate()` tells Mongoose "before you hand this back to me, go fetch the real document for these ids and swap it in", so instead of just an id we get a full object with the fields we `select`.
const populateTicket = (query: any) =>
  query
    // Turn the stored `assignee` id into a full embedded object, but only include email/firstName/role (not the whole user document, e.g. no password hash).
    .populate({ path: "assignee", select: "email firstName role" })
    // Turn the stored `checklists` ids into full checklist objects, and for each checklist, also populate its `items` (a checklist has items, and we want those expanded too - nested populate).
    .populate({ path: "checklists", populate: { path: "items" } })
    // Also expand `raisedBy` (whoever originally raised/created the ticket) into a full user object with just the safe fields.
    .populate({ path : "raisedBy" , select : "email firstName role"})

// This is the core Role-Based Access Control (RBAC) rule for tickets: given the logged-in user, build a MongoDB filter object that describes which tickets they're allowed to see.
// It gets passed straight into Ticket.find(filter) / Ticket.countDocuments(filter) etc.
const visibilityFilter = (user: AccessTokenPayload) => {
  // ADMIN can see everything - an empty filter `{}` matches every document in MongoDB.
  if (user.role === "ADMIN") return {}

  if (user.role === "MANAGER") {
    // A manager should always see tickets they personally raised...
    const or: Record<string, unknown>[] = [{ userId: user.sub }];
    // ...plus every ticket in their department (if they have one)...
    if (user.departmentId) or.push({ departmentId: user.departmentId });
    // ...plus every ticket tied to their store (if they have one).
    if (user.storeId) or.push({ storeId: user.storeId })
    // `$or` is MongoDB's "match ANY of these conditions" operator - so the manager sees the union of all three groups above.
    return { $or: or }
  }

  // AGENT can see tickets assigned to them, OR tickets they personally raised (userId). They can't see other agents' or other departments' tickets.
  if (user.role === 'AGENT') return { $or: [{ assigneeId: user.sub }, { userId: user.sub }] };

  // Fallback for a plain USER role: they can only ever see tickets they themselves raised (userId matches their own id). This is the most restricted view.
  return { userId: user.sub }
}

// Checks whether `user` is allowed to MUTATE (update) a specific `ticket` - separate from visibilityFilter, because "can I see it" and "can I edit it" aren't always the same permission.
// Throws an AppError.forbidden() (which becomes an HTTP 403) if not allowed; otherwise just returns normally (no return value needed - returning early means "allowed").
const assertCanMutate = (user: AccessTokenPayload, ticket: any) => {
  // Admins can edit anything.
  if (user.role === "ADMIN") return;

  if (user.role === "MANAGER") {
    // Manager can edit the ticket if it belongs to their department...
    const sameDept = user.departmentId && String(ticket.departmentId) === user.departmentId
    // ...or their store (ObjectIds are compared as strings since one might be an ObjectId instance and the other a plain string from the token).
    const sameStore = user.storeId && String(ticket.storeId) === user.storeId;

    if (sameDept || sameStore) return
    // If neither matches, they're trying to touch a ticket outside their scope - block it.
    throw AppError.forbidden("Outside your department/store")
  }

  if (user.role === 'AGENT') {
    // An agent can only edit a ticket if it's currently assigned to them.
    if (String(ticket.assigneeId) === user.sub) return;
    throw AppError.forbidden('Not assigned to you');
  }

  // Any other role (e.g. plain USER) is never allowed to mutate a ticket at all.
  throw AppError.forbidden()
};

// The actual exported service object - the controller calls these methods. All the real database/business logic lives here.
export const ticketService = {
  // List tickets for the given user, with pagination.
  async list(user: AccessTokenPayload, page: number, limit: number) {
    // Build the RBAC filter first so the user only ever queries/counts tickets they're allowed to see.
    const filter = visibilityFilter(user);
    // Run both queries in parallel with Promise.all (faster than awaiting them one after another) - one to grab the actual page of data, one to get the total count for pagination info.
    const [data, total] = await Promise.all([
      // Ticket.find(filter) starts a query matching the visibility filter; sort newest-first; skip past earlier pages; limit to `limit` results (classic offset pagination). populateTicket() then attaches the population rules before it actually runs.
      populateTicket(Ticket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
      // Total number of matching tickets (ignoring skip/limit) so the client can calculate how many pages exist.
      Ticket.countDocuments(filter),
    ]);
    return {
      data,
      // hasNext: true if there are more tickets beyond what's on this page.
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total },
    };
  },

  // Fetch a single ticket by id, but only if the requesting user is allowed to see it.
  async getById(id: string, user: AccessTokenPayload) {
    const ticket = await populateTicket(Ticket.findById(id))

    if (!ticket) throw AppError.notFound("Ticket not found");
    // Admins skip the extra check since they can see everything anyway; everyone else needs an explicit re-check.
    if (user.role !== "ADMIN") {
      // Ask MongoDB "does a ticket exist with this exact _id AND matching my visibility filter?" - this re-uses the same rules as the list endpoint so a user can't just guess another ticket's id to peek at it.
      const visible = await Ticket.exists({ _id: id, ...visibilityFilter(user) })

      if (!visible) throw AppError.forbidden();
    }
    return ticket;
  },

  // Create a brand new ticket.
  async create(input: CreateTicketInput, user: AccessTokenPayload) {
    // Spread the validated input fields plus stamp on `userId` = whoever is creating it (so we always know who raised the ticket, regardless of what the client sent).
    const ticket = await Ticket.create({ ...input, userId: user.sub })
    // Write an audit log entry recording that this ticket was created, by whom, and what its initial state (`after`) looked like. There's no `before` because it didn't exist yet.
    await auditService.record({
      entityType: "Ticket",
      entityId: ticket._id.toString(),
      action: "CREATE",
      actorId: user.sub,
      after: ticket.toObject()
    })

    // Re-fetch the ticket with all its references populated (assignee, checklists, raisedBy) so we can return/broadcast a nice, fully-expanded object instead of raw ids.
    const populated = await populateTicket(Ticket.findById(ticket._id));
    // Broadcast a real-time "ticket:created" event over the socket layer so any connected clients (e.g. dashboards) can update live. We pass along the relevant ids (who owns it, who it's assigned to, department/store) so the socket layer can decide which connected users should receive this event, plus the full populated ticket as the payload.
    emitTicketEvent("ticket:created", {
      userId:       ticket.userId?.toString(),
      assigneeId:   ticket.assigneeId?.toString() ?? null,
      departmentId: ticket.departmentId?.toString() ?? null,
      storeId:      ticket.storeId?.toString() ?? null,
    }, populated);

    // If the ticket was created with an assignee already set, fire off a notification (e.g. push/email/in-app) letting that person know they've been assigned something.
    if(ticket.assigneeId){
      await notificationService.notifyTicketAssigned(ticket)
    }

    return populated;
  },

  // Update (PATCH) an existing ticket.
  async update(id: string, input: UpdateTicketInput, user: AccessTokenPayload) {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw AppError.notFound("Ticket not found")
    // Permission check: can this user actually mutate this specific ticket? Throws a 403 if not (see assertCanMutate above).
    assertCanMutate(user, ticket)

    // Snapshot what the ticket looked like BEFORE we change it, for the audit log and to detect if the assignee changed.
    const before = ticket.toObject();
    // Copy every field from `input` onto the ticket document (only fields the client actually sent, since updateTicketSchema makes everything optional).
    Object.assign(ticket, input);
    // Persist the changes to MongoDB.
    await ticket.save()

    // Log this update in the audit trail with both the before and after snapshots, so changes are traceable.
    await auditService.record({
      entityType: "Ticket",
      entityId: ticket._id.toString(),
      action: "UPDATE",
      actorId: user.sub,
      before,
      after: ticket.toObject()
    });

    // Re-fetch with populated references again, same reasoning as in create().
    const populated = await populateTicket(Ticket.findById(ticket._id));
    const target = {
      userId: ticket.userId?.toString(),
      assigneeId: ticket.assigneeId?.toString() ?? null,
      departmentId: ticket.departmentId?.toString() ?? null,
      storeId: ticket.storeId?.toString() ?? null,
    };

    // Always broadcast a general "ticket:updated" event so anyone watching this ticket sees the change live.
    emitTicketEvent("ticket:updated", target, populated);

    // If this update included a new assigneeId, AND it's actually different from who it was assigned to before, treat this as a re-assignment: fire a more specific "ticket:assigned" event and send a notification to the new assignee.
    if (input.assigneeId && input.assigneeId !== before.assigneeId?.toString()) {
      emitTicketEvent("ticket:assigned", target, populated)
      await notificationService.notifyTicketAssigned(ticket);
    }

    return populated;
  },

  // Delete a ticket outright (only reachable by ADMIN, enforced at the route level in ticket.routes.ts).
  async remove(id: string, user: AccessTokenPayload) {
    // findByIdAndDelete both finds and removes it in one database call, returning the document as it was right before deletion (or null if it didn't exist).
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) throw AppError.notFound("Ticket not found")

    // Record the deletion in the audit log. There's no `after` state since the ticket no longer exists - only `before` (what it looked like right before deletion).
    await auditService.record({
      entityType: "Ticket",
      entityId: ticket._id.toString(),
      action: "DELETE",
      actorId: user.sub,
      before: ticket.toObject(),
    })
    return ticket;
  }
};