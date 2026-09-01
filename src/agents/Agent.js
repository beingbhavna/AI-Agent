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
        this.toolExecutor = new ToolExecutor(this.toolManager);
        this.toolSelector = new ToolSelector(ai);
        this.agentExecutor = new AgentExecutor(this.toolExecutor);
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

    async chat(userId, message) {
        try {
            // =================================================
            // 1. Initialize RAG
            // =================================================
            await this.rag.init();
            // =================================================
            // 2. Save User Message
            // =================================================

            await this.memory.addMessage(userId, "user", message);
            // =================================================
            // 3. Load Conversation History
            // =================================================
            const history = await this.memory.getConversation(userId);
            // =================================================
            // 4. Search Knowledge Base
            // =================================================

            let context = "";
            let sources = [];

            try {
                const ragResult = await this.rag.search(userId, message);
                context = ragResult?.context || "";

                sources = ragResult?.sources || [];

            } catch (error) {
                console.log("RAG Error:", error.message);
            }
            console.log("RAG Context:", context);
            // =================================================
            // 5. Get Available Tools
            // =================================================
            const tools = this.toolManager.getDefinitions();
            // =================================================
            // 6. Create Initial Agent Plan
            // =================================================

            let planResponse = '{"steps":[]}';
            try {
                planResponse = await this.planner.plan(message, tools);
            } catch (error) {
                console.log("Planner Error:", error.message);
            }
            console.log("🧠 Agent Plan:", planResponse);
            // =================================================
            // 7. Parse Planner Response
            // =================================================
            let plan;
            try {
                plan = this.parsePlannerResponse(planResponse);
            } catch (error) {
                console.log("❌ Planner JSON Error:", error.message);
                plan = {
                    steps: []
                };
            }
            // =================================================
            // 8. Validate Plan
            // =================================================
            if (!plan || !Array.isArray(plan.steps)) {
                plan = {
                    steps: []
                };
            }
            // =================================================
            // 9. DATABASE WORKFLOW FIX
            // =================================================
            //
            // If planner only returned database_schema,
            // execute schema first and then generate the
            // actual SQL query.
            //
            // This fixes:
            //
            // User:
            // "How many messages do I have?"
            //
            // Planner:
            // database_schema
            //
            // Without this block the SQL query never executes.
            // =================================================
            const hasDatabaseSchemaStep = plan.steps.some(step => step.tool === "database_schema");

            const hasSqlStep = plan.steps.some(step => step.tool === "sql");
            if (hasDatabaseSchemaStep && !hasSqlStep) {
                console.log("🗄️ Database schema required before SQL.");
                // ---------------------------------------------
                // Execute schema step first
                // ---------------------------------------------
                let schemaResults = [];
                try {
                    schemaResults = await this.agentExecutor.execute({
                        steps: plan.steps.filter(step => step.tool === "database_schema")
                    });
                } catch (error) {
                    console.log("❌ Schema Execution Error:", error.message);
                    schemaResults = [];
                }
                console.log("🧪 SCHEMA RESULTS:", JSON.stringify(schemaResults, null, 2));
                // ---------------------------------------------
                // Extract schema
                // ---------------------------------------------

                const schemaResult =
                    schemaResults.find(
                        item =>
                            item.tool ===
                            "database_schema"
                    );


                const schema =
                    schemaResult?.result?.schema || [];


                // ---------------------------------------------
                // Generate SQL from schema + question
                // ---------------------------------------------

                const generatedSql =
                    await this.generateSQLFromSchema(
                        message,
                        userId,
                        schema
                    );


                if (generatedSql) {

                    plan = {
                        steps: [
                            ...plan.steps.filter(
                                step =>
                                    step.tool !==
                                    "database_schema"
                            ),
                            {
                                step: 1,
                                tool: "sql",
                                input: generatedSql,
                                dependsOn: null
                            }
                        ]
                    };

                } else {

                    // If SQL could not be generated,
                    // keep schema result for final response.

                    plan = {
                        steps: []
                    };

                    // Preserve schema result
                    // so final AI knows what happened.
                    schemaResults.forEach(
                        result => {
                            if (
                                !result.tool ||
                                result.tool !==
                                "database_schema"
                            ) {
                                return;
                            }
                        }
                    );

                    // Store separately for final prompt
                    this.lastSchemaResults =
                        schemaResults;
                }
            }


            // =================================================
            // 10. Execute Final Plan
            // =================================================

            let toolResults = [];

            if (plan.steps.length > 0) {

                try {
                    toolResults = await this.agentExecutor.execute(plan, userId);
                    console.log("🧪 TOOL EXECUTION RESULTS:", JSON.stringify(toolResults, null, 2));
                } catch (error) {

                    console.log(
                        "❌ Agent Executor Error:",
                        error.message
                    );

                    toolResults = [];
                }
            }


            // =================================================
            // 11. Add Schema Results If SQL Was Generated
            // =================================================

            if (
                this.lastSchemaResults &&
                this.lastSchemaResults.length > 0
            ) {

                toolResults = [
                    ...this.lastSchemaResults,
                    ...toolResults
                ];

                this.lastSchemaResults = [];
            }


            // =================================================
            // 12. Conversation History
            // =================================================

            const historyText =
                history
                    .map(chat =>
                        `${chat.role}: ${chat.text}`
                    )
                    .join("\n");


            // =================================================
            // 13. Prepare Tool Results
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
                                    ? JSON.stringify(
                                        item.input
                                    )
                                    : item.input}

Result:
${JSON.stringify(
                                        item.result,
                                        null,
                                        2
                                    )}
`;

                        })
                        .join(
                            "\n----------------------\n"
                        )
                    : "No tools were executed.";


            console.log(
                "🧪 FINAL TOOL RESULTS:",
                JSON.stringify(
                    toolResults,
                    null,
                    2
                )
            );


            // =================================================
            // 14. FINAL AI PROMPT
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

3. If one tool depends on another tool, use the resolved result.

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

17. If the user asks for database information and SQL returned a result, answer directly using that SQL result.

18. Keep the final answer clear and concise.

19. For a message-count question, if SQL returns:
{
    "rows": [
        {
            "total": X
        }
    ]
}
then answer:
"You have a total of X messages in your history."

20. Return ONLY the answer to the user.
`;


            // =================================================
            // 15. Generate Final Answer
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
            // 16. Add Sources
            // =================================================

            if (sources && sources.length > 0 && context) {
                answer += "\n\n📚 Sources:\n";
                const uniqueSources = [];
                for (const source of sources) {
                    const sourceText = `• ${source.fileName} (Chunk ${source.chunk})`;
                    if (!uniqueSources.includes(sourceText)) {
                        uniqueSources.push(sourceText);
                    }
                }
                answer += uniqueSources.join("\n");
            }
            await this.memory.addMessage(userId, "assistant", answer);
            console.log("✅ Assistant Response Saved");
            return answer;
        } catch (error) {
            console.log("❌ Agent Error:", error.message);
            const fallback = "Sorry, I'm unable to process your request right now. Please try again in a moment.";
            try {
                await this.memory.addMessage(userId, "assistant", fallback);
            } catch (saveError) {
                console.log("❌ Error saving fallback response:", saveError.message);
            }
            return fallback;
        }
    }


    // =========================================================
    // GENERATE SQL FROM DATABASE SCHEMA
    // =========================================================

    async generateSQLFromSchema(message, userId, schema) {
        try {
            if (!schema || !Array.isArray(schema) || schema.length === 0) {
                console.log("❌ No database schema available.");
                return null;
            }
            const schemaText = schema.map(table => {
                const columns = (table.columns || []).map(column => `${column.COLUMN_NAME} ${column.DATA_TYPE}`).join(", ");
                return `TABLE ${table.table} (${columns})`;
            })
                .join("\n");
            const sqlPrompt = `
You are a SQL query generator.

User question:
${message}

Current user ID:
${userId}

Database schema:
${schemaText}

Generate ONE safe SELECT SQL query that answers the user's question.

Rules:

1. Only generate SELECT queries.

2. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, GRANT or REVOKE.

3. Use only tables and columns that exist in the supplied schema.

4. For questions about the user's messages, use:
messages.user_id = '${userId}'

5. For "How many messages do I have?", generate:
SELECT COUNT(*) AS total FROM messages WHERE user_id = '${userId}'

6. Do not query sensitive columns such as password.

7. Return ONLY the SQL query.

`;


            const response =
                await retry(() =>
                    this.ai.models.generateContent({
                        model: MODEL,
                        contents: sqlPrompt
                    })
                );


            let sql =
                response.text?.trim() || "";


            // Remove markdown SQL fences
            sql = sql.replace(/^```sql\s*/i,
                "");
            sql = sql.replace(/^```\s*/i, "");
            sql = sql.replace(/```$/i, "");
            sql = sql.trim();
            console.log("🧠 Generated SQL:", sql);
            if (!sql || !sql.toLowerCase().startsWith("select")) {
                console.log("❌ Generated SQL is not a SELECT query.");
                return null;
            }
            // Block dangerous SQL
            const blockedKeywords = [
                "insert",
                "update",
                "delete",
                "drop",
                "truncate",
                "alter",
                "create",
                "grant",
                "revoke"
            ];
            const lowerSql = sql.toLowerCase();
            for (const keyword of blockedKeywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, "i");
                if (regex.test(sql)) {
                    console.log(`❌ Dangerous SQL keyword detected: ${keyword}`);
                    return null;
                }
            }
            // Never allow password column
            if (/\bpassword\b/i.test(sql)) {
                console.log("❌ Sensitive password column detected.");
                return null;
            }
            return sql;
        } catch (error) {
            console.log("❌ SQL Generation Error:", error.message);
            return null;
        }
    }

    parsePlannerResponse(response) {
        if (!response || typeof response !== "string") {
            return {
                steps: []
            };
        }
        let cleaned = response.trim();
        // Remove markdown ```json
        cleaned = cleaned.replace(/^```json\s*/i, "");
        // Remove markdown ```
        cleaned = cleaned.replace(/```$/i, "");
        cleaned = cleaned.trim();
        // Find JSON object if model added extra text
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        const parsed = JSON.parse(cleaned);
        if (!parsed || !Array.isArray(parsed.steps)) {
            return {
                steps: []
            };
        }
        return parsed;
    }
}