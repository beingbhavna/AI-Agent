import AgentExecutor from "./AgentExecutor.js";
import PromptManager from "./PromptManager.js";
import MemoryManager from "./MemoryManager.js";
import ToolManager from "../tools/ToolManager.js";
import { logTool } from "../utils/logger.js";
import { retry } from "../utils/retry.js";
import { MODEL } from "../config/constants.js";
import RAGManager from "../rag/RAGManager.js";
import ToolExecutor from "./ToolExecutor.js";
import AgentPlanner from "./AgentPlanner.js";

export default class Agent {

    constructor(ai) {
        this.ai = ai;

        this.promptManager = new PromptManager();
        this.memory = new MemoryManager();
        this.toolManager = new ToolManager();
        this.toolExecutor = new ToolExecutor(this.toolManager);
        this.agentExecutor = new AgentExecutor(this.toolExecutor);
        this.rag = new RAGManager();
        this.planner = new AgentPlanner(ai);
    }


    async init() {

        await this.rag.init();

    }


    async chat(userId, message) {

        try {

            // ==========================================
            // 1. Initialize RAG
            // ==========================================

            await this.rag.init();


            // ==========================================
            // 2. Save User Message
            // ==========================================

            await this.memory.addMessage(
                userId,
                "user",
                message
            );


            // ==========================================
            // 3. Get Conversation History
            // ==========================================

            const history =
                await this.memory.getConversation(userId);


            // ==========================================
            // 4. Search Knowledge Base
            // ==========================================

            const ragResult =
                await this.rag.search(userId, message);

            const context = ragResult.context;
            const sources = ragResult.sources;

            console.log("RAG Context:", context);


            // ==========================================
            // 5. Get Available Tools
            // ==========================================

            const tools =
                this.toolManager.getDefinitions();


            // ==========================================
            // 6. Create Agent Plan
            // ==========================================

            let planResponse = '{"steps":[]}';

            try {

                planResponse =
                    await this.planner.plan(
                        message,
                        tools
                    );

            } catch (error) {

                console.log(
                    "Planner Error:",
                    error.message
                );

            }


            console.log(
                "🧠 Agent Plan:",
                planResponse
            );


            // ==========================================
            // 7. Parse Plan
            // ==========================================

            let plan;

            try {

                plan = JSON.parse(planResponse);

            } catch (error) {

                console.log(
                    "❌ Invalid Planner JSON"
                );

                plan = {
                    steps: []
                };

            }


            // ==========================================
            // 8. Safety Validation
            // ==========================================

            if (!plan || !Array.isArray(plan.steps)) {

                plan = {
                    steps: []
                };

            }


            // ==========================================
            // 9. Execute Planned Tools
            // ==========================================

            let answer = "";


            // ==========================================
            // TOOL EXECUTION
            // ==========================================

            if (plan.steps && plan.steps.length > 0) {

                const toolResults = await this.agentExecutor.execute(plan);

                for (let i = 0; i < plan.steps.length; i++) {

                    const step = plan.steps[i];

                    console.log(`🔧 Executing Tool: ${step.tool}`);
                    console.log(`📥 Input: ${step.input}`);

                    try {

                        const result = await this.toolExecutor.execute(
                            step.tool,
                            step.input
                        );

                        console.log(`📤 Result:`, result);

                        toolResults.push({
                            step: i + 1,
                            tool: step.tool,
                            input: step.input,
                            result
                        });

                        logTool(
                            step.tool,
                            step.input,
                            result
                        );

                    } catch (error) {

                        console.log(
                            `❌ Tool Error (${step.tool}):`,
                            error.message
                        );

                        toolResults.push({
                            step: i + 1,
                            tool: step.tool,
                            input: step.input,
                            result: {
                                success: false,
                                error: error.message
                            }
                        });
                    }
                }

                // ==========================================
                // FINAL AI PROMPT
                // ==========================================

                const historyText = history
                    .map(chat => `${chat.role}: ${chat.text}`)
                    .join("\n");

                const toolResultsText = toolResults
                    .map(item => `
Step ${item.step}
Tool: ${item.tool}
Input: ${item.input}
Result:
${JSON.stringify(item.result, null, 2)}
`)
                    .join("\n--------------------\n");

                const finalPrompt = `
You are BhavnaAI, an intelligent AI assistant.

Your job is to answer the user's question using the tool results provided below.

Conversation History:
${historyText}

User Question:
${message}

Tool Results:
${toolResultsText}

Knowledge Base Context:
${context}

IMPORTANT RULES:

1. Use the actual tool results to answer the user.
2. If multiple tools were executed, combine their results logically.
3. If a later tool depends on an earlier tool, use the earlier result correctly.
4. Do not expose internal tool names, step numbers, planner details, or template variables such as {{step1.total}}.
5. Do not invent values.
6. If a calculation/comparison was requested, clearly state the final result.
7. If SQL returned a value, use that exact value.
8. If the knowledge base is relevant, use it.
9. If the tool result contains an error, explain the problem naturally.
10. Give a concise, natural answer directly to the user.

Return only the final answer.
`;

                const response = await retry(() =>
                    this.ai.models.generateContent({
                        model: MODEL,
                        contents: finalPrompt
                    })
                );

                answer = response.text;

                // ==========================================
                // ADD RAG SOURCES
                // ==========================================

                if (sources && sources.length > 0) {

                    answer += "\n\n📚 Sources:\n";

                    sources.forEach(source => {

                        answer +=
                            `• ${source.fileName} (Chunk ${source.chunk})\n`;
                    });
                }
            }


            // ==========================================
            // 11. NORMAL RAG CHAT
            // ==========================================

            else {

                const historyText = history
                    .map(chat =>
                        `${chat.role}: ${chat.text}`
                    )
                    .join("\n");


                const prompt = `
You are BhavnaAI, an intelligent AI assistant.

Use ONLY the information provided in the Knowledge Base Context.

If the answer is not present in the context, say:

"I couldn't find this information in the uploaded documents."

Knowledge Base Context:
${context}

Conversation History:
${historyText}

User:
${message}

Assistant:
`;


                const response = await retry(() =>
                    this.ai.models.generateContent({

                        model: MODEL,

                        contents: prompt

                    })
                );


                answer = response.text;

            }


            // ==========================================
            // 12. Add RAG Sources
            // ==========================================

            if (
                sources &&
                sources.length > 0
            ) {

                answer += "\n\n📚 Sources:\n";


                // Remove duplicate sources

                const uniqueSources = [];

                const seen = new Set();


                for (const source of sources) {

                    const key =
                        `${source.fileName}-${source.chunk}`;


                    if (!seen.has(key)) {

                        seen.add(key);

                        uniqueSources.push(source);

                    }

                }


                uniqueSources.forEach(source => {

                    answer +=
                        `• ${source.fileName} (Chunk ${source.chunk})\n`;

                });

            }


            // ==========================================
            // 13. Save Assistant Response
            // ==========================================

            await this.memory.addMessage(
                userId,
                "assistant",
                answer
            );


            console.log(
                "✅ Assistant Response Saved"
            );


            // ==========================================
            // 14. Return Answer
            // ==========================================

            return answer;


        } catch (error) {

            console.log(
                "❌ Agent Error:",
                error.message
            );


            return "Sorry, I'm unable to process your request right now. Please try again in a moment.";

        }

    }

}