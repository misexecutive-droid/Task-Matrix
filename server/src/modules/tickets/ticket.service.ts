import { Ticket } from "../../models/Ticket.js"
import { AppError } from "../../utils/AppError.js"
import type { AccessTokenPayload } from "../../middleware/auth/auth.js"
import type { CreateTicketInput  , UpdateTicketInput } from "./ticket.validation.js"
import App from "../../app.js"

const populateTicket = (query : any) => 
    query
     .populate({ path : "assignee" , select : "email firtName role"})
     .populate({ path : "checklist", populate : { path : "items"} })

const visibilityFilter = (user : AccessTokenPayload) => {
    if(user.role === "ADMIN") return {}

    if(user.role === "MANAGER"){
        const or: Record<string, unknown>[] = [{ userId : user.sub}];
        if(user.departmentId) or.push({ deparmentId : user.departmentId});
        if(user.storeId) or.push({ storeId : user.storeId})
        return { $or : or}
    }

  if (user.role === 'AGENT') return { $or: [{ assigneeId: user.sub }, { userId: user.sub }] };

  return { userId : user.sub}
}

const assertCanMutate = (user : AccessTokenPayload, Ticket : any) => {
    if(user.role === "ADMIN") return;

    if(user.role === "MANAGER"){
        const sameDept = user.departmentId && String(Ticket.departmentId ) === user.departmentId
        const sameStore = user.storeId && String(Ticket.storeId) === user.storeId;

        if(sameDept || sameStore) return
         throw AppError.forbidden("Outside your department/store")
    }

   if (user.role === 'AGENT') {
    if (String(ticket.assigneeId) === user.sub) return;
    throw AppError.forbidden('Not assigned to you');
  }

  throw AppError.forbidden()
};

export const ticketService = {
  async list(user: AccessTokenPayload, page: number, limit: number) {
    const filter = visibilityFilter(user);
    const [data, total] = await Promise.all([
      populateTicket(Ticket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
      Ticket.countDocuments(filter),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total },
    };
  },
  
   async getById( id : string , user : AccessTokenPayload) {
    const ticket = await populateTicket(Ticket.findById(id))

    if(!ticket) throw AppError.notFound("Ticket not found");
    if(user.role !== "ADMIN"){
        const visible = await Ticket.exists({ _id : id , ...visibilityFilter(user)})

        if(!visible) throw AppError.forbidden();
    }
    return ticket;
  },

  async create(input : CreateTicketInput , user : AccessTokenPayload){
    const ticket = await Ticket.create({...input, userId : user.sub})
    return populateTicket(Ticket.findById(ticket._id))
  },

  async update(id : string , input : UpdateTicketInput , user : AccessTokenPayload){
    const ticket = await Ticket.findById(id);
    if(!ticket) throw AppError.notFound("Ticket not found")
        assertCanMutate(user, ticket)

    Object.assign(ticket , input);
    await ticket.save()
    return populateTicket(Ticket.findById(ticket._id))
  },

  async remove(id : string) {
    const ticket = await Ticket.findByIdAndDelete(id);
    if(!ticket) throw AppError.notFound("Ticket not found")
    return ticket;
  }
}



 


