export default class MemoryManager {

    constructor() {
        this.memory = new Map();
    }

    getConversation(userId) {
        return this.memory.get(userId) || [];
    }

    addMessage(userId, role, text) {

        const conversation = this.getConversation(userId);

        conversation.push({
            role,
            text
        });

        this.memory.set(userId, conversation);
    }

    clearConversation(userId) {
        this.memory.delete(userId);
    }

}