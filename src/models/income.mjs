import mongoose from "mongoose";
const { Schema } = mongoose;

const incomeSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    amount: {
        type: Number,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // Transform on retrieval
    },
}, {
    timestamps: true  // Apply getters when converting to JSON

})

const Income = mongoose.model('Income', incomeSchema)
export default Income