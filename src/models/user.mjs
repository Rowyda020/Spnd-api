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
        type: String,
        unique: true,
        sparse: true
    },
    authType: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // Transform on retrieval
    },
}, {
    timestamps: true  // Apply getters when converting to JSON

})

const User = mongoose.model('User', userSchema);
export default User