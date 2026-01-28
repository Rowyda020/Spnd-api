import mongoose from "mongoose";
const { Schema } = mongoose

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false
    },
    totalIncome: {
        type: Number,
        default: 0.0
    },
    email: {
        type: String,
        unique: true,
        lowercase: true
    },
    googleId: {
        type: String
    },
    authType: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})

const User = mongoose.model('User', userSchema);
export default User