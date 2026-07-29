import Conversation from "../models/Conversation.js";

export default class MemoryManager {

    async getConversation(userId) {
        try {
            const conversation = await Conversation.findOne({ userId });
            return conversation ? conversation.messages : [];
        } catch (error) {
            console.warn("Memory read failed:", error.message);
            return [];
        }
    }

    async addMessage(userId, role, text) {
        try {
            let conversation = await Conversation.findOne({ userId });

            if (!conversation) {
                conversation = new Conversation({
                    userId,
                    messages: []
                });
            }

            conversation.messages.push({
                role,
                text
            });

            await conversation.save();
        } catch (error) {
            console.warn("Memory write failed:", error.message);
        }
    }

    async clearConversation(userId) {
        try {
            await Conversation.deleteOne({ userId });
        } catch (error) {
            console.warn("Memory clear failed:", error.message);
        }
    }
}