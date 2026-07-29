import { Schema, model } from "mongoose";

export const EVENT_TYPES = ["DEADLINE", "ANNOUNCEMENT", "BROADCAST"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

const eventSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: null, trim: true },
        type: { type: String, enum: EVENT_TYPES, default: "ANNOUNCEMENT" },
        eventDate: { type: Date, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Event = model("Event", eventSchema);
