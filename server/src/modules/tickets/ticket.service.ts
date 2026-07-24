import { Ticket } from "../../models/Ticket.js"
import { AppError } from "../../utils/AppError.js"
import { assertChecklistsResolved } from "../../utils/checklistGate.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTicketInput, UpdateTicketInput, VerifyTicketInput } from "./ticket.validation.js"
import { auditService } from "../audit/audit.service.js"
import { emitTicketEvent } from "../../sockets/ticketEvent.js"
import { notificationService } from "../notifications/notification.service.js"
import { settingsService } from "../settings/settings.service.js"

const populateTicket = (query: any) =>
  query
    .populate({ path: "assignee", select: "email firstName role" })
    .populate({ path: "checklists", populate: { path: "items" } })
    .populate({ path: "raisedBy", select: "email firstName role" })


const visibilityFilter = (user: AccessTokenPayload) => {
  // ADMIN can see everything - an empty filter `{}` matches every document in MongoDB.
  if (user.role === "ADMIN") return {}

  if (user.role === "MANAGER" || user.role === "PC") {
    // A manager/PC should always see tickets they personally raised...
    const or: Record<string, unknown>[] = [{ userId: user.sub }];
    // ...plus every ticket in their department (if they have one)...
    if (user.departmentId) or.push({ departmentId: user.departmentId });
    // ...plus every ticket tied to their store (if they have one).
    if (user.storeId) or.push({ storeId: user.storeId })
    // `$or` is MongoDB's "match ANY of these conditions" operator - so they see the union of all three groups above.
    // (PC only ever *mutates* through verify(), which does its own scoping check — this just
    // covers what they're allowed to see, e.g. the IN_REVIEW tickets in their department.)
    return { $or: or }
  }

  // AGENT can see tickets assigned to them, OR tickets they personally raised (userId). They can't see other agents' or other departments' tickets.
  if (user.role === 'AGENT') return { $or: [{ assigneeId: user.sub }, { userId: user.sub }] };

  // Fallback for a plain USER role: they can only ever see tickets they themselves raised (userId matches their own id). This is the most restricted view.
  return { userId: user.sub }
}

// Shared by MANAGER's mutate check and PC's verify check: is this ticket inside the user's
// own department or store? (ObjectIds compared as strings since one might be an ObjectId
// instance and the other a plain string from the token.)
const isSameDeptOrStore = (user: AccessTokenPayload, ticket: any) => {
  const sameDept = user.departmentId && String(ticket.departmentId) === user.departmentId
  const sameStore = user.storeId && String(ticket.storeId) === user.storeId;
  return Boolean(sameDept || sameStore)
}

// Checks whether `user` is allowed to MUTATE (update) a specific `ticket` - separate from visibilityFilter, because "can I see it" and "can I edit it" aren't always the same permission.
// Throws an AppError.forbidden() (which becomes an HTTP 403) if not allowed; otherwise just returns normally (no return value needed - returning early means "allowed").
const assertCanMutate = (user: AccessTokenPayload, ticket: any) => {
  // Admins can edit anything.
  if (user.role === "ADMIN") return;
  if (user.role === "AGENT") {
    if (String(ticket.assigneeId) === user.sub) return;
    throw AppError.forbidden("Not assigned to you")
  }

  if (user.role === "MANAGER") {
    if (isSameDeptOrStore(user, ticket)) return
    // If neither matches, they're trying to touch a ticket outside their scope - block it.
    throw AppError.forbidden("Outside your department/store")
  }

  if (user.role === "USER") {
    if (String(ticket.userId) === user.sub) return;
    throw AppError.forbidden("Not your ticket")
  }

  // PC only ever acts through ticketService.verify(), never the generic update path.
  // Any other role (e.g. plain USER) is never allowed to mutate a ticket at all.
  throw AppError.forbidden()
};

// The actual exported service object - the controller calls these methods. All the real database/business logic lives here.
export const ticketService = {
  // List tickets for the given user, with pagination. `status` (optional) narrows it down to
  // one lifecycle status - e.g. the PC verification queue asks for `status: 'IN_REVIEW'` only.
  async list(user: AccessTokenPayload, page: number, limit: number, status?: string) {
    // Build the RBAC filter first so the user only ever queries/counts tickets they're allowed to see.
    const filter: Record<string, unknown> = visibilityFilter(user);
    if (status) filter.status = status;
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
    const tatHours = input.tatHours ?? settingsService.getCached().defaultTatHours;
    const ticket = await Ticket.create({ ...input, tatHours, userId: user.sub })
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
      userId: ticket.userId?.toString(),
      assigneeId: ticket.assigneeId?.toString() ?? null,
      departmentId: ticket.departmentId?.toString() ?? null,
      storeId: ticket.storeId?.toString() ?? null,
    }, populated);

    if (ticket.assigneeId) {
      await notificationService.notifyTicketAssigned(ticket)
    }

    return populated;
  },

  async update(id: string, input: UpdateTicketInput, user: AccessTokenPayload) {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw AppError.notFound("Ticket not found")
    assertCanMutate(user, ticket)

    const before = ticket.toObject();

    if (input.status === "CLOSED" && before.status !== "CLOSED") {
      // Closing is now a PC/Admin-only action, done through ticketService.verify() — everyone
      // else can only hand the ticket off to IN_REVIEW (see the gate right below) and wait for
      // that verification step.
      if (user.role !== "ADMIN" && user.role !== "PC") {
        throw AppError.forbidden("Only a verifier can close a ticket — send it for review instead.")
      }
      ticket.closedAt = new Date();
    } else if (input.status === "IN_REVIEW" && before.status !== "IN_REVIEW") {
      // Sending a ticket for review is blocked until every not-done checklist item has remarks
      // explaining why — no remarks needed while it's still open, only at the point someone
      // hands it off to the PC for verification.
      const withItems = await Ticket.findById(id).populate({ path: "checklists", populate: { path: "items" } });
      assertChecklistsResolved((withItems as any).checklists, "sending this ticket for review")
    } else if (input.status && input.status !== "CLOSED" && before.status === "CLOSED") {
      ticket.closedAt = null;
    }
    Object.assign(ticket, input);
    await ticket.save()

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

    // Just handed off to review — let the department's PCs know there's something to check.
    if (input.status === "IN_REVIEW" && before.status !== "IN_REVIEW") {
      await notificationService.notifyPendingVerification(ticket);
    }

    return populated;
  },

  // PC/Admin-only: approve (truly close) or reject (bounce back to IN_PROGRESS) a ticket
  // that's currently IN_REVIEW.
  async verify(id: string, input: VerifyTicketInput, user: AccessTokenPayload) {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw AppError.notFound("Ticket not found")

    // PC is scoped to their own department/store, same as MANAGER's mutate check above; ADMIN
    // can verify anything regardless of scope.
    if (user.role === "PC" && !isSameDeptOrStore(user, ticket)) {
      throw AppError.forbidden("Outside your department/store")
    }

    if (ticket.status !== "IN_REVIEW") {
      throw AppError.badRequest("This ticket isn't pending verification.")
    }

    const before = ticket.toObject();

    if (input.action === "APPROVE") {
      ticket.status = "CLOSED";
      ticket.closedAt = new Date();
      ticket.verifiedBy = user.sub as any;
      ticket.verifiedAt = new Date();
      ticket.verificationNote = input.note ?? null;
    } else {
      ticket.status = "IN_PROGRESS";
      ticket.verificationNote = input.note ?? null;
    }
    await ticket.save()

    await auditService.record({
      entityType: "Ticket",
      entityId: ticket._id.toString(),
      action: "UPDATE",
      actorId: user.sub,
      before,
      after: ticket.toObject(),
    })

    const populated = await populateTicket(Ticket.findById(ticket._id));
    emitTicketEvent("ticket:updated", {
      userId: ticket.userId?.toString(),
      assigneeId: ticket.assigneeId?.toString() ?? null,
      departmentId: ticket.departmentId?.toString() ?? null,
      storeId: ticket.storeId?.toString() ?? null,
    }, populated);

    await notificationService.notifyVerificationResult(ticket, input.action, input.note)

    return populated;
  },

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
  },

 async tatReport(groupBy: 'hour' | 'day' | 'week' | 'month', from?: string, to?: string) {
    const DATE_FORMATS: Record<'hour' | 'day' | 'week' | 'month', string> = {
      hour:  '%Y-%m-%dT%H:00',
      day:   '%Y-%m-%d',
      week:  '%G-W%V',
      month: '%Y-%m',
    }

    const match : Record<string , any> = { closedAt : { $ne : null}}
    if(from) match.closedAt.$gte = new Date(from);
    if(to) match.closedAt.$lte = new Date(to);

    const rows = await Ticket.aggregate([
      { $match : match},
      {
        $project : {
          bucket : { $dateToString : { format : DATE_FORMATS[groupBy] , date : "$closedAt"}},
          tatActualHours : { $divide : [{ $subtract : ["$closedAt" , "$createdAt"]}, 1000*60*60]},
          isOverdue : 1,
        },

      },
      {
        $group : {
          _id : "$bucket",
          count : { $sum : 1},
          avgTatHours : { $avg : "$tatActualHours"},
          overdueCount : { $sum : { $cond : ["$isOverdue", 1,0]}},

        }
      },
      { $sort : { _id : 1}}
    ]);

    return rows.map(r => ({
      bucket : r._id as string,
      count : r.count as number,
      avgTatHours : r.avgTatHours != null ? Math.round(r.avgTatHours * 10) / 10 : null,
      overdueCount : r.overdueCount as number 

    }))
  }
}