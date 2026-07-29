import Conversation from "../models/Conversation.js";

export default class MemoryManager {

    async getConversation(userId) {

        const conversation = await Conversation.findOne({ userId });

        return conversation ? conversation.messages : [];
    }

    async addMessage(userId, role, text) {

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
    }

    async clearConversation(userId) {
        await Conversation.deleteOne({ userId });
    }
}