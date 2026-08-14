import { SmartTaskConversation } from "../../models/SmartTaskConversation.js"
import { AppError } from "../../utils/AppError.js"
import type { CreateSmartTaskConversationInput, PatchSmartTaskConversationInput } from "./smartTaskConversation.validation.js"

// Short auto-generated label for the history list so entries are distinguishable at a glance
// without opening each one — just the first few words of what the user actually typed, no AI call.
const buildTitle = (text: string): string => {
    if (!text) return "New conversation";
    const words = text.trim().split(/\s+/);
    const short = words.slice(0, 8).join(" ");
    return words.length > 8 ? `${short}…` : short;
};

export const smartTaskConversationService = {
    async create(userId: string, input: CreateSmartTaskConversationInput) {
        return SmartTaskConversation.create({
            userId,
            messages: input.messages,
            status: "in_progress",
        });
    },

    // Covers append (messages), and both finalize cases (status + resultingTaskId) — one endpoint,
    // varying body. The {_id, userId} filter doubles as the ownership check: a mismatched id
    // (wrong owner or nonexistent) 404s the same way either way, so it never leaks whether a
    // conversation belonging to someone else exists at all.
    async patch(id: string, userId: string, input: PatchSmartTaskConversationInput) {
        const conversation = await SmartTaskConversation.findOneAndUpdate(
            { _id: id, userId },
            { $set: input },
            { new: true },
        );
        if (!conversation) throw AppError.notFound("Conversation not found");
        return conversation;
    },

    // Lightweight summary for the history list — full message arrays aren't needed until a
    // specific conversation is actually opened, so this keeps the list payload small.
    async listForUser(userId: string) {
        const conversations = await SmartTaskConversation.find({ userId })
            .sort({ createdAt: -1 })
            .select("messages status resultingTaskId createdAt updatedAt")
            .lean();

        return conversations.map((c: any) => {
            const firstUserMessage = c.messages.find((m: any) => m.from === "user");
            return {
                id: c._id.toString(),
                status: c.status,
                resultingTaskId: c.resultingTaskId?.toString() ?? null,
                messageCount: c.messages.length,
                title: buildTitle(firstUserMessage?.text ?? ""),
                preview: firstUserMessage?.text ?? "",
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            };
        });
    },

    async getOne(id: string, userId: string) {
        const conversation = await SmartTaskConversation.findOne({ _id: id, userId });
        if (!conversation) throw AppError.notFound("Conversation not found");
        return conversation;
    },

    // Admin-only bulk clear (see route gating) — scoped to the calling admin's own history, same
    // as every other endpoint here; there's no cross-user history to clear.
    async deleteAllForUser(userId: string) {
        const result = await SmartTaskConversation.deleteMany({ userId });
        return { deletedCount: result.deletedCount ?? 0 };
    },
};
