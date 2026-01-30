import mongoose from "mongoose";
const { Schema } = mongoose;

const sharedBudgetSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    budgetname: {
        type: String,

    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],

    amount: {
        type: Number,
        default: 0.0,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // Transform on retrieval
    },
}, { timestamps: true })

const SharedBudget = mongoose.model('SharedBudget', sharedBudgetSchema)
export default SharedBudget