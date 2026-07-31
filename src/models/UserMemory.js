import mongoose from "mongoose";

const UserMemorySchema = new mongoose.Schema({

    userId: {
        type: String,
        required: true
    },

    key: {
        type: String,
        required: true
    },

    value: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});

export default mongoose.model(
    "UserMemory",
    UserMemorySchema
);