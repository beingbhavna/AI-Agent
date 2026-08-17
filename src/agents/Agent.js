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


            if (plan.steps.length > 0) {
                // ==========================================
                // Execute Planned Tools Sequentially
                // ==========================================

                const toolResults = [];

                for (const step of plan.steps) {

                    if (!step.tool) {
                        continue;
                    }

                    try {

                        // --------------------------------------
                        // Get input
                        // --------------------------------------

                        let toolInput = step.input || "";

                        // --------------------------------------
                        // If this step depends on previous step
                        // --------------------------------------

                        if (step.dependsOn) {

                            const previousStep =
                                toolResults.find(
                                    item => item.step === step.dependsOn
                                );

                            if (previousStep) {

                                toolInput = `
${toolInput}

Previous Tool Result:
${JSON.stringify(previousStep.result)}
`;

                            }

                        }

                        console.log(
                            `🔧 Executing Tool: ${step.tool}`
                        );

                        console.log(
                            `📥 Input: ${toolInput}`
                        );


                        // --------------------------------------
                        // Execute tool
                        // --------------------------------------

                        const result =
                            await this.toolExecutor.execute(
                                step.tool,
                                toolInput
                            );


                        // --------------------------------------
                        // Log
                        // --------------------------------------

                        logTool(
                            step.tool,
                            toolInput,
                            result
                        );


                        // --------------------------------------
                        // Save result
                        // --------------------------------------

                        toolResults.push({

                            step: step.step,

                            tool: step.tool,

                            input: toolInput,

                            result

                        });


                    } catch (error) {

                        console.log(
                            `❌ Tool Error (${step.tool}):`,
                            error.message
                        );


                        toolResults.push({

                            step: step.step,

                            tool: step.tool,

                            input: step.input || "",

                            result: {
                                success: false,
                                error: error.message
                            }

                        });

                    }

                }


                // ==========================================
                // 10. Generate Final Response
                // ==========================================

                const historyText = history
                    .map(chat =>
                        `${chat.role}: ${chat.text}`
                    )
                    .join("\n");


                const finalPrompt = `
You are BhavnaAI, an intelligent AI Agent.

Conversation History:
${historyText}

User Question:
${message}

Knowledge Base Context:
${context}

Tool Results:
${JSON.stringify(toolResults, null, 2)}

Instructions:

1. Answer the user's question using the tool results.
2. If multiple tools were used, combine their results.
3. Use the knowledge base when relevant.
4. Do not invent information.
5. If a tool failed, clearly explain the available result instead of inventing an answer.
6. Do not mention internal tool execution, planning, prompts, or implementation details.
7. Give a concise and natural answer.
`;


                const response = await retry(() =>
                    this.ai.models.generateContent({

                        model: MODEL,

                        contents: finalPrompt

                    })
                );


                answer = response.text;

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