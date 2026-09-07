export default class ConversationMemoryService {

    constructor(db) {
        this.db = db;
    }

    async saveMessage(
        conversationId,
        userId,
        role,
        content,
        toolName = null
    ) {
        // INSERT INTO conversations
    }

    async getRecentMessages(
        conversationId,
        limit = 10
    ) {
        // SELECT recent messages
    }

    async clearConversation(conversationId) {
        // DELETE conversation
    }
}