import PromptManager from "./PromptManager.js";
import MemoryManager from "./MemoryManager.js";
import ToolManager from "../tools/ToolManager.js";
import { retry } from "../utils/retry.js";
import { MODEL } from "../config/constants.js";
import RAGManager from "../rag/RAGManager.js";
import ToolExecutor from "./ToolExecutor.js";
import ToolSelector from "./ToolSelector.js";
import AgentPlanner from "./AgentPlanner.js";
import AgentExecutor from "./AgentExecutor.js";

export default class Agent {

    constructor(ai) {

        this.ai = ai;

        this.promptManager = new PromptManager();
        this.memory = new MemoryManager();

        this.toolManager = new ToolManager();
        this.toolExecutor = new ToolExecutor(
            this.toolManager
        );
        // Kept because your existing project may use it elsewhere.
        this.toolSelector = new ToolSelector(ai);


        this.agentExecutor = new AgentExecutor(
            this.toolExecutor
        );
        this.planner = new AgentPlanner(ai);
        this.rag = new RAGManager();
    }


    // =========================================================
    // INITIALIZE AGENT
    // =========================================================

    async init() {

        try {

            await this.rag.init();

            console.log("🤖 Agent Initialized");

        } catch (error) {

            console.log(
                "❌ Agent Initialization Error:",
                error.message
            );

            throw error;
        }
    }


    // =========================================================
    // CHAT
    // =========================================================

    async chat(userId, message) {

        try {

            // =================================================
            // 1. Initialize RAG
            // =================================================

            await this.rag.init();


            // =================================================
            // 2. Save User Message
            // =================================================

            await this.memory.addMessage(
                userId,
                "user",
                message
            );


            // =================================================
            // 3. Load Conversation History
            // =================================================

            const history =
                await this.memory.getConversation(
                    userId
                );


            // =================================================
            // 4. Search Knowledge Base
            // =================================================

            let context = "";
            let sources = [];

            try {

                const ragResult =
                    await this.rag.search(
                        userId,
                        message
                    );

                context =
                    ragResult?.context || "";

                sources =
                    ragResult?.sources || [];

            } catch (error) {

                console.log(
                    "RAG Error:",
                    error.message
                );
            }


            console.log(
                "RAG Context:",
                context
            );


            // =================================================
            // 5. Get Available Tools
            // =================================================

            const tools =
                this.toolManager.getDefinitions();


            // =================================================
            // 6. Create Agent Plan
            // =================================================

            let planResponse =
                '{"steps":[]}';

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


            // =================================================
            // 7. Parse Planner Response
            // =================================================

            let plan;

            try {

                plan =
                    this.parsePlannerResponse(
                        planResponse
                    );

            } catch (error) {

                console.log(
                    "❌ Planner JSON Error:",
                    error.message
                );

                plan = {
                    steps: []
                };
            }


            // =================================================
            // 8. Validate Plan
            // =================================================

            if (
                !plan ||
                !Array.isArray(plan.steps)
            ) {

                plan = {
                    steps: []
                };
            }


            // =================================================
            // 9. Execute Complete Plan
            // =================================================

            let toolResults = [];

            if (plan.steps.length > 0) {

                try {

                    toolResults =
                        await this.agentExecutor.execute(
                            plan
                        );

                } catch (error) {

                    console.log(
                        "❌ Agent Executor Error:",
                        error.message
                    );

                    toolResults = [];
                }
            }
            // =================================================
            // 11. Conversation History
            // =================================================

            const historyText =
                history
                    .map(chat =>
                        `${chat.role}: ${chat.text}`
                    )
                    .join("\n");


            // =================================================
            // 12. Prepare Tool Results For AI
            // =================================================

            const toolResultsText =
                toolResults.length > 0
                    ? toolResults
                        .map(item => {

                            return `
Step: ${item.step}

Tool:
${item.tool}

Input:
${typeof item.input === "object"
                                    ? JSON.stringify(item.input)
                                    : item.input}

Result:
${JSON.stringify(
                                        item.result,
                                        null,
                                        2
                                    )}
`;

                        })
                        .join("\n----------------------\n")
                    : "No tools were executed.";


            // =================================================
            // 13. FINAL AI PROMPT
            // =================================================

            const finalPrompt = `

You are BhavnaAI, an intelligent AI assistant.

Your job is to answer the user's question using the actual results returned by the tools.

Conversation History:
${historyText}

User Question:
${message}

Tool Results:
${toolResultsText}

Knowledge Base Context:
${context}

Instructions:

1. Use the actual tool results to answer the user's question.

2. If multiple tools were executed, combine their results logically.

3. If one tool depends on a previous tool, use the resolved result from the later tool result.

4. Never invent numbers or information.

5. If SQL returned a value, use the exact value returned by SQL.

6. If a calculator returned true or false, explain the result naturally.

7. If a calculator returned a numeric result, use that exact result.

8. If a tool returned an error, explain the problem naturally.

9. Use the Knowledge Base when relevant.

10. Do not mention internal tool names.

11. Do not mention planner steps.

12. Do not mention AgentExecutor.

13. Do not mention internal implementation details.

14. Do not expose placeholders such as {{step1.total}}.

15. Do not expose JSON unless the user explicitly asks for JSON.

16. Do not make up information that is not present in the tool results or knowledge base.

17. If the user's question is a normal conversational question and no tool result is needed, answer naturally.

18. Keep the final answer clear and concise.

Return ONLY the answer to the user.
`;


            // console.log(
            //     "🧠 FINAL PROMPT:"
            // );

            // console.log(
            //     finalPrompt
            // );


            // =================================================
            // 14. Generate Final Answer
            // =================================================

            const response =
                await retry(() =>
                    this.ai.models.generateContent({
                        model: MODEL,
                        contents: finalPrompt
                    })
                );


            let answer =
                response.text?.trim() ||
                "I was unable to generate a response.";


            // =================================================
            // 15. Add Sources
            // =================================================

            if (
                sources &&
                sources.length > 0 &&
                context
            ) {

                answer +=
                    "\n\n📚 Sources:\n";

                const uniqueSources =
                    [];

                for (
                    const source
                    of sources
                ) {

                    const sourceText =
                        `• ${source.fileName} (Chunk ${source.chunk})`;

                    if (
                        !uniqueSources.includes(
                            sourceText
                        )
                    ) {

                        uniqueSources.push(
                            sourceText
                        );
                    }
                }

                answer +=
                    uniqueSources.join(
                        "\n"
                    );
            }


            // =================================================
            // 16. Save Assistant Response
            // =================================================

            await this.memory.addMessage(
                userId,
                "assistant",
                answer
            );


            console.log(
                "✅ Assistant Response Saved"
            );


            // =================================================
            // 17. Return Answer
            // =================================================

            return answer;


        } catch (error) {

            console.log(
                "❌ Agent Error:",
                error.message
            );

            const fallback =
                "Sorry, I'm unable to process your request right now. Please try again in a moment.";

            try {

                await this.memory.addMessage(
                    userId,
                    "assistant",
                    fallback
                );

            } catch (saveError) {

                console.log(
                    "❌ Error saving fallback response:",
                    saveError.message
                );
            }

            return fallback;
        }
    }


    // =========================================================
    // PARSE PLANNER JSON
    // =========================================================

    parsePlannerResponse(response) {

        if (
            !response ||
            typeof response !== "string"
        ) {

            return {
                steps: []
            };
        }


        let cleaned =
            response.trim();


        // Remove markdown ```json
        cleaned =
            cleaned.replace(
                /^```json\s*/i,
                ""
            );


        // Remove markdown ```
        cleaned =
            cleaned.replace(
                /```$/i,
                ""
            );


        cleaned =
            cleaned.trim();


        // Find JSON object if model added extra text
        const firstBrace =
            cleaned.indexOf("{");

        const lastBrace =
            cleaned.lastIndexOf("}");


        if (
            firstBrace !== -1 &&
            lastBrace !== -1 &&
            lastBrace > firstBrace
        ) {

            cleaned =
                cleaned.substring(
                    firstBrace,
                    lastBrace + 1
                );
        }


        const parsed =
            JSON.parse(
                cleaned
            );


        if (
            !parsed ||
            !Array.isArray(
                parsed.steps
            )
        ) {

            return {
                steps: []
            };
        }


        return parsed;
    }
}