import mongoose from "mongoose";
const { Schema } = mongoose;

const incomeSchema = new Schema({
    userId: {
        type: string
    },
    amount: {
        type: Number,
        required: true
    },
    soruce: {
        type: string,
        required: true
    },
    category: {
        type: string,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})

const Income = mongoose.model('Income', incomeSchema)
export default Income