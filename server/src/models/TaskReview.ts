import { Schema, model } from "mongoose"

export const REVIEW_DECISIONS  = ["approved ", "rejected"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

const taskReviewSchema = new Schema (
    {
        taskId : { type : Schema.Types.ObjectId, ref : "Task", required : true},
        reviewerId : { type : Schema.Types.ObjectId, ref : "User", required : true},
        decision : { type : String, enum : REVIEW_DECISIONS, required : true},

        qualityRating : {
            type : Number,
            min : 1,
            max : 5,
            required : function(this : any) { return this.decision === "approved"}
        },

        remarks : {
            type : String,
            trim : true,
            required : function(this : any) { return this.decision === "rejected"}

        },

        wasOnTime : { type : Boolean, default : null}
    },
    { timesStamps : true, toJSON : { virtuals : true}, toObject : { virtuals : true}}
);

taskReviewSchema.index({ taskId : 1, createdAt : -1});
taskReviewSchema.index({ reviewerId : 1, createdAt : -1});

export const TaskReview = model ("TaskReview", taskReviewSchema);