import mongoose from "mongoose";
const { Schema } = mongoose;

const expenseSchema = new Schema({
    userId: {
        type: string
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: string
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

const Expense = mongoose.model('Expense', expenseSchema)
export default Expense