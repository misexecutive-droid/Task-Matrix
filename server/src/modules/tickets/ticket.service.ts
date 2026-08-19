import path from "node:path"
import { Types } from "mongoose"
import { Ticket } from "../../models/Ticket.js"
import { TicketStatusUpdate } from "../../models/TicketStatusUpdate.js"
import { TicketAttachment } from "../../models/TicketAttachment.js"
import { AppError } from "../../utils/AppError.js"
import { assertChecklistsResolved } from "../../utils/checklistGate.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTicketInput, UpdateTicketInput, VerifyTicketInput, StatusUpdateInput } from "./ticket.validation.js"
import { auditService } from "../audit/audit.service.js"
import { emitTicketEvent } from "../../sockets/ticketEvent.js"
import { notificationService } from "../notifications/notification.service.js"
import { settingsService } from "../settings/settings.service.js"
import { DATE_FORMATS, type DateBucket } from "../../utils/index.js"

const populateTicket = (query: any) =>
  query
    .populate({ path: "assignee", select: "email firstName role" })
    .populate({ path: "checklists", populate: { path: "items", populate: { path: "images" } } })
    .populate({ path: "raisedBy", select: "email firstName role" })
    .populate({ path: "attachments", populate: { path: "uploadedBy", select: "email firstName role" } })
    .populate({
      path: "comments",
      populate: { path: "author", select: "email firstName role" },
      options: { sort: { createdAt: 1 } },
    })
    .populate({
      path: "statusUpdates",
      populate: [
        { path: "changedBy", select: "email firstName role" },
        { path: "photos" },
      ],
      options: { sort: { createdAt: -1 } },
    })


const visibilityFilter = (user: AccessTokenPayload) => {
  // PC has the same org-wide access as ADMIN — same as tasks (see task.service.ts's own
  // visiblityFilter), so a PC user isn't blocked from other departments' tickets.
  if (user.role === "ADMIN" || user.role === "PC") return {}

  if (user.role === "MANAGER") {
    const or: Record<string, unknown>[] = [{ userId: user.sub }];
    if (user.departmentId) or.push({ departmentId: user.departmentId });
    if (user.storeId) or.push({ storeId: user.storeId })
    return { $or: or }
  }

  // SENIOR is store-only (no department fallback) — an Area Head oversees exactly one store.
  if (user.role === "SENIOR") {
    return user.storeId ? { storeId: user.storeId } : { userId: user.sub };
  }

  if (user.role === 'AGENT' || user.role === 'USER') {
    const own = { $or: [{ assigneeId: user.sub }, { userId: user.sub }] };
    return user.departmentId ? { $and: [own, { departmentId: user.departmentId }] } : own;
  }

  return { userId: user.sub }
}

const isSameDeptOrStore = (user: AccessTokenPayload, ticket: any) => {
  const sameDept = user.departmentId && String(ticket.departmentId) === user.departmentId
  const sameStore = user.storeId && String(ticket.storeId) === user.storeId;
  return Boolean(sameDept || sameStore)
}

const assertCanMutate = (user: AccessTokenPayload, ticket: any) => {
  if (user.role === "ADMIN" || user.role === "PC") return;
  if (user.role === "AGENT" || user.role === "USER") {

    const ownTicket = String(ticket.assigneeId) === user.sub || String(ticket.userId) === user.sub;
    const inOwnDept = !user.departmentId || String(ticket.departmentId) === user.departmentId;
    if (ownTicket && inOwnDept) return;
    throw AppError.forbidden("Not your ticket")
  }

  if (user.role === "MANAGER") {
    if (isSameDeptOrStore(user, ticket)) return
    throw AppError.forbidden("Outside your department/store")
  }

  if (user.role === "SENIOR") {
    if (user.storeId && String(ticket.storeId) === user.storeId) return;
    throw AppError.forbidden("Outside your store")
  }

  throw AppError.forbidden()
};

export const ticketService = {
  async list(user: AccessTokenPayload, page: number, limit: number, status?: string, assigneeId?: string) {
    const filter: Record<string, unknown> = visibilityFilter(user);
    if (status) filter.status = status;
    if (assigneeId && (user.role === "ADMIN" || user.role === "PC")) {
      filter.$or = [{ userId: assigneeId }, { assigneeId }];
    }
    const [data, total] = await Promise.all([
      populateTicket(Ticket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
      Ticket.countDocuments(filter),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total },
    };
  },

  async getById(id: string, user: AccessTokenPayload) {
    const ticket = await populateTicket(Ticket.findById(id))

    if (!ticket) throw AppError.notFound("Ticket not found");
    if (user.role !== "ADMIN" && user.role !== "PC") {
      const visible = await Ticket.exists({ _id: id, ...visibilityFilter(user) })

      if (!visible) throw AppError.forbidden();
    }
    return ticket;
  },

  async create(input: CreateTicketInput, user: AccessTokenPayload) {
    const tatHours = input.tatHours ?? settingsService.getCached().defaultTatHours;
    const ticket = await Ticket.create({ ...input, tatHours, userId: user.sub })
    await auditService.record({
      entityType: "Ticket",
      entityId: ticket._id.toString(),
      action: "CREATE",
      actorId: user.sub,
      after: ticket.toObject()
    })

    const populated = await populateTicket(ticket);
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

      if (user.role !== "ADMIN" && user.role !== "PC") {
        throw AppError.forbidden("Only a verifier can close a ticket — send it for review instead.")
      }
      ticket.closedAt = new Date();
    } else if (input.status === "IN_REVIEW" && before.status !== "IN_REVIEW") {
      await ticket.populate({ path: "checklists", populate: { path: "items" } });
      assertChecklistsResolved((ticket as any).checklists, "sending this ticket for review")
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

    const populated = await populateTicket(ticket);
    const target = {
      userId: ticket.userId?.toString(),
      assigneeId: ticket.assigneeId?.toString() ?? null,
      departmentId: ticket.departmentId?.toString() ?? null,
      storeId: ticket.storeId?.toString() ?? null,
    };

    emitTicketEvent("ticket:updated", target, populated);

    if (input.assigneeId && input.assigneeId !== before.assigneeId?.toString()) {
      emitTicketEvent("ticket:assigned", target, populated)
      await notificationService.notifyTicketAssigned(ticket);
    }

    if (input.status === "IN_REVIEW" && before.status !== "IN_REVIEW") {
      await notificationService.notifyPendingVerification(ticket);
    }

    return populated;
  },

  async addStatusUpdate(id: string, input: StatusUpdateInput, files: Express.Multer.File[], user: AccessTokenPayload) {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw AppError.notFound("Ticket not found")
    assertCanMutate(user, ticket)

    const before = ticket.toObject();


    if (input.status === "IN_REVIEW" && before.status !== "IN_REVIEW") {
      await ticket.populate({ path: "checklists", populate: { path: "items" } });
      assertChecklistsResolved((ticket as any).checklists, "sending this ticket for review")
    }

    if (before.status === "CLOSED") {
      ticket.closedAt = null;
    }

    const statusUpdate = await TicketStatusUpdate.create({
      ticketId: ticket._id,
      changedBy: user.sub,
      fromStatus: before.status,
      toStatus: input.status,
      remark: input.remark,
    })

    if (files.length) {
      await TicketAttachment.insertMany(
        files.map((file) => ({
          url: `/uploads/ticket-attachments/${path.basename(file.path)}`,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          captureMethod: input.captureMethod ?? "GALLERY",
          statusUpdateId: statusUpdate._id,
          ticketId: ticket._id,
          uploadedBy: user.sub,
        })),
      )
    }

    ticket.status = input.status;
    await ticket.save()

    await auditService.record({
      entityType: "Ticket",
      entityId: ticket._id.toString(),
      action: "UPDATE",
      actorId: user.sub,
      before,
      after: ticket.toObject(),
    });

    const populated = await populateTicket(ticket);
    const target = {
      userId: ticket.userId?.toString(),
      assigneeId: ticket.assigneeId?.toString() ?? null,
      departmentId: ticket.departmentId?.toString() ?? null,
      storeId: ticket.storeId?.toString() ?? null,
    };
    emitTicketEvent("ticket:updated", target, populated);

    if (input.status === "IN_REVIEW" && before.status !== "IN_REVIEW") {
      await notificationService.notifyPendingVerification(ticket);
    }

    if (input.status === "ON_HOLD" && before.status !== "ON_HOLD") {
      await notificationService.notifyTicketOnHold(ticket, input.remark, user.sub);
    }

    return populated;
  },


  async verify(id: string, input: VerifyTicketInput, user: AccessTokenPayload) {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw AppError.notFound("Ticket not found")

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

    const populated = await populateTicket(ticket);
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
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) throw AppError.notFound("Ticket not found")

    await auditService.record({
      entityType: "Ticket",
      entityId: ticket._id.toString(),
      action: "DELETE",
      actorId: user.sub,
      before: ticket.toObject(),
    })
    return ticket;
  },

 async tatReport(groupBy: DateBucket, from?: string, to?: string, departmentId?: string, storeId?: string) {

    const closedMatch : Record<string , any> = { closedAt : { $ne : null}}
    if(from) closedMatch.closedAt = { ...closedMatch.closedAt, $gte : new Date(from)};
    if(to) closedMatch.closedAt = { ...closedMatch.closedAt, $lte : new Date(to)};
    if(departmentId) closedMatch.departmentId = new Types.ObjectId(departmentId);
    if(storeId) closedMatch.storeId = new Types.ObjectId(storeId);

    const createdMatch : Record<string , any> = {}
    if(from || to) {
      createdMatch.createdAt = {}
      if(from) createdMatch.createdAt.$gte = new Date(from);
      if(to) createdMatch.createdAt.$lte = new Date(to);
    }
    if(departmentId) createdMatch.departmentId = new Types.ObjectId(departmentId);
    if(storeId) createdMatch.storeId = new Types.ObjectId(storeId);

    const [facet] = await Ticket.aggregate([
      {
        $facet : {
          closed : [
            { $match : closedMatch },
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
                closedCount : { $sum : 1},
                avgTatHours : { $avg : "$tatActualHours"},
                overdueCount : { $sum : { $cond : ["$isOverdue", 1,0]}},
              }
            },
          ],
          created : [
            { $match : createdMatch },
            {
              $group : {
                _id : { $dateToString : { format : DATE_FORMATS[groupBy] , date : "$createdAt"}},
                createdCount : { $sum : 1 },
              }
            },
          ],
        }
      }
    ]);

    const closedByBucket = new Map<string, { closedCount : number; avgTatHours : number | null; overdueCount : number }>(
      facet.closed.map((r : any) => [r._id as string, { closedCount : r.closedCount, avgTatHours : r.avgTatHours, overdueCount : r.overdueCount }])
    );
    const createdByBucket = new Map<string, number>(facet.created.map((r : any) => [r._id as string, r.createdCount as number]));

    const buckets = [...new Set([...closedByBucket.keys(), ...createdByBucket.keys()])].sort();

    return buckets.map(bucket => {
      const closed = closedByBucket.get(bucket);
      const createdCount = createdByBucket.get(bucket) ?? 0;
      const closedCount = closed?.closedCount ?? 0;
      return {
        bucket,
        createdCount,
        closedCount,
        avgTatHours : closed?.avgTatHours != null ? Math.round(closed.avgTatHours * 10) / 10 : null,
        overdueCount : closed?.overdueCount ?? 0,
        completionRate : createdCount ? Math.round((closedCount / createdCount) * 1000) / 10 : null,
      }
    });
  }
}