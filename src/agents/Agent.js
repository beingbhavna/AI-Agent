import PromptManager from "./PromptManager.js";
import MemoryManager from "./MemoryManager.js";
export default class Agent {
    constructor(ai) {
        this.ai = ai;
        this.promptManager = new PromptManager();
        this.memory = new MemoryManager();
    }
    async chat(userId, message) {
        this.memory.addMessage(userId, "user", message);
        const history = this.memory.getConversation(userId);
        let prompt = this.promptManager.getSystemPrompt();
        prompt += "\n\nConversation:\n";
        history.forEach((chat) => {
            prompt += `${chat.role}: ${chat.text}\n`;
        });

        const response = await this.ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });
        const answer = response.text;
        this.memory.addMessage(userId, "assistant", answer);
        return answer;
    }
}