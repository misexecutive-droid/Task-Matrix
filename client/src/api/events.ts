import { apiFetch } from "./http";

export type EventType = "DEADLINE" | "ANNOUNCEMENT" | "BROADCAST";

export type EventCreator = { id: string; firstName: string; lastName: string | null };

export type Event = {
    id: string;
    title: string;
    description: string | null;
    type: EventType;
    eventDate: string;
    createdBy: EventCreator;
    createdAt: string;
};

export type ApiResponse<T> = { success: boolean; data: T };

export type CreateEventPayload = {
    title: string;
    description?: string;
    type?: EventType;
    eventDate: string;
};

export type UpdateEventPayload = Partial<CreateEventPayload>;

export const eventApi = {
    getAll: () => apiFetch<ApiResponse<Event[]>>("/events"),
    getUpcoming: (limit = 5) => apiFetch<ApiResponse<Event[]>>(`/events/upcoming?limit=${limit}`),
    create: (payload: CreateEventPayload) =>
        apiFetch<ApiResponse<Event>>("/events", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: UpdateEventPayload) =>
        apiFetch<ApiResponse<Event>>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: (id: string) =>
        apiFetch<ApiResponse<{ deleted: boolean }>>(`/events/${id}`, { method: "DELETE" }),
};
