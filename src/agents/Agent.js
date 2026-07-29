import PromptManager from "./PromptManager.js";
import MemoryManager from "./MemoryManager.js";
import ToolManager from "../tools/ToolManager.js";
import ToolSelector from "./ToolSelector.js";
import { logTool } from "../utils/logger.js";
import { retry } from "../utils/retry.js";
import { MODEL } from "../config/constants.js";
// import RagService from "../rag/RagService.js";
import RAGManager from "../rag/RAGManager.js";

export default class Agent {

    constructor(ai) {
        this.ai = ai;
        this.promptManager = new PromptManager();
        this.memory = new MemoryManager();
        this.toolManager = new ToolManager();
        this.toolSelector = new ToolSelector(ai);
        this.rag = new RAGManager();
    }
    async init() {
        await this.rag.init();
    }

    async chat(userId, message) {
        try {
            await this.rag.init();

            // ===========================
            // Save User Message
            // ===========================

            await this.memory.addMessage(userId, "user", message);
            const context = await this.rag.search(message);
            // ===========================
            // Get Conversation History
            // ===========================

            const history = await this.memory.getConversation(userId);

            // ===========================
            // Available Tools
            // ===========================

            const tools = this.toolManager.getDefinitions();

            // ===========================
            // Decide Which Tool To Use
            // ===========================

            let toolDecision = '{"tool":"none"}';

            try {
                toolDecision = await this.toolSelector.decide(message, tools);
            } catch (error) {
                console.log("ToolSelector Error:", error.message);
            }
            console.log("Tool Decision:", toolDecision);
            let decision;
            try {
                decision = JSON.parse(toolDecision);
            } catch (error) {
                console.log("Invalid Tool JSON");
                decision = {
                    tool: "none"
                };
            }
            let answer = "";

            // ======================================================
            // TOOL EXECUTION
            // ======================================================

            if (decision.tool !== "none") {
                let result;
                try {
                    const tool = this.toolManager.getTool(decision.tool);
                    if (!tool) {
                        throw new Error(`Tool '${decision.tool}' not found`);
                    }
                    result = await tool.execute(decision.input);
                    logTool(decision.tool, decision.input, result);
                } catch (error) {
                    console.log("Tool Error:", error.message);
                    result = {
                        success: false,
                        error: error.message
                    };
                }

                const finalPrompt = `You are BhavnaAI, an intelligent AI Agent.Conversation History:${history.map(chat => `${chat.role}: ${chat.text}`).join("\n")}

User Question:
${message}
Tool Used:
${decision.tool}
Tool Result:
${JSON.stringify(result)}
Use the knowledge base if it contains relevant information.
Respond naturally to the user.
`;

                const response = await retry(() =>
                    this.ai.models.generateContent({
                        model: MODEL,
                        contents: finalPrompt
                    })
                );

                answer = response.text;

            }

            // ======================================================
            // NORMAL CHAT
            // ======================================================

            else {

                let prompt =
                    this.promptManager.getSystemPrompt();

                prompt += `Knowledge Base:${context} Conversation:`;

                history.forEach(chat => {

                    prompt += `${chat.role}: ${chat.text}\n`;

                });

                prompt += `user: ${message}assistant:`;

                const response = await retry(() =>
                    this.ai.models.generateContent({
                        model: MODEL,
                        contents: prompt
                    })
                );

                answer = response.text;

            }

            // ===========================
            // Save Assistant Response
            // ===========================

            await this.memory.addMessage(
                userId,
                "assistant",
                answer
            );

            return answer;

        } catch (error) {

            console.log("Agent Error:", error.message);

            return "Sorry, I'm unable to process your request right now. Please try again in a moment.";

        }

    }

}