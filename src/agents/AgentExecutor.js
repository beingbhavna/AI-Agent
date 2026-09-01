import { logTool } from "../utils/logger.js";
import RAGContextBuilder from "../rag/RAGContextBuilder.js";
import RAGPromptBuilder from "../rag/RAGPromptBuilder.js";

export default class AgentExecutor {

    constructor(toolExecutor) {

        if (!toolExecutor) {
            throw new Error("ToolExecutor is required");
        }

        if (typeof toolExecutor.execute !== "function") {
            throw new Error(
                "Invalid ToolExecutor: execute() method is missing"
            );
        }

        this.toolExecutor = toolExecutor;

        // ==========================================
        // RAG Components
        // ==========================================

        this.ragContextBuilder = new RAGContextBuilder();
        this.ragPromptBuilder = new RAGPromptBuilder();
    }


    async execute(plan, userId, originalQuestion) {

        const results = [];


        // ==========================================
        // Validate Plan
        // ==========================================

        if (!plan || !Array.isArray(plan.steps)) {

            return {
                results: [],
                ragContext: "",
                finalPrompt: ""
            };
        }


        // ==========================================
        // Execute Plan Steps
        // ==========================================

        for (let i = 0; i < plan.steps.length; i++) {

            const step = plan.steps[i];

            if (!step || !step.tool) {
                continue;
            }


            let input = step.input ?? "";


            // ==========================================
            // Resolve Dependency
            // ==========================================

            if (step.dependsOn) {

                const previousStep = results.find(
                    item => item.step === step.dependsOn
                );


                if (previousStep) {

                    const previousResult =
                        previousStep.result;


                    // ======================================
                    // SQL Rows Result
                    // ======================================

                    if (
                        previousResult &&
                        Array.isArray(previousResult.rows) &&
                        previousResult.rows.length > 0
                    ) {

                        const row =
                            previousResult.rows[0];


                        for (
                            const key of Object.keys(row)
                        ) {

                            const placeholder =
                                `{{step${step.dependsOn}.${key}}}`;


                            input = input.replace(
                                placeholder,
                                String(row[key])
                            );
                        }
                    }


                    // ======================================
                    // Direct Result
                    // ======================================

                    else if (
                        previousResult !== undefined &&
                        previousResult !== null
                    ) {

                        const placeholder =
                            `{{step${step.dependsOn}.result}}`;


                        input = input.replace(
                            placeholder,
                            String(previousResult)
                        );
                    }
                }
            }


            // ==========================================
            // Execute Tool
            // ==========================================

            console.log(
                `🔧 Executing Tool: ${step.tool}`
            );

            console.log(
                `📥 Input:`,
                input
            );

            console.log(
                `👤 User:`,
                userId
            );


            let result;


            try {

                result =
                    await this.toolExecutor.execute(
                        step.tool,
                        input,
                        userId
                    );


                // ======================================
                // Tool Logging
                // ======================================

                logTool(
                    step.tool,
                    input,
                    result
                );

            } catch (error) {

                console.error(
                    `❌ Tool Error (${step.tool}):`,
                    error.message
                );


                result = {
                    success: false,
                    error: error.message
                };
            }


            // ==========================================
            // Store Tool Result
            // ==========================================

            results.push({

                step: step.step ?? i + 1,

                tool: step.tool,

                input,

                result
            });
        }


        // =====================================================
        // RAG PROCESSING
        // =====================================================

        console.log(
            "🧠 Starting RAG processing..."
        );


        // ==========================================
        // Collect document_search results
        // ==========================================

        const documentResults = results
            .filter(item => {

                return (
                    item.tool === "document_search" &&
                    item.result?.success === true
                );

            })
            .flatMap(item => {

                return item.result?.documents || [];

            });


        console.log(
            `📚 RAG Documents Found: ${documentResults.length}`
        );


        // ==========================================
        // Build RAG Context
        // ==========================================

        let ragContext = "";


        if (documentResults.length > 0) {

            ragContext =
                this.ragContextBuilder.build({
                    documents: documentResults
                });

        }


        console.log(
            "📖 RAG Context:"
        );

        console.log(
            ragContext || "No relevant document context found."
        );


        // ==========================================
        // Build Final Prompt
        // ==========================================

        let finalPrompt = "";


        if (ragContext) {

            finalPrompt =
                this.ragPromptBuilder.build(
                    originalQuestion || "",
                    ragContext
                );

        } else {

            // No document context available.
            // Still create a prompt so the caller
            // knows that document information was
            // not found.

            finalPrompt = this.ragPromptBuilder.build(
                    originalQuestion || "",
                    ""
                );
        }


        console.log(
            "📝 Final RAG Prompt Created"
        );


        // ==========================================
        // Return Execution + RAG Result
        // ==========================================

        return {

            results,

            ragContext,

            finalPrompt

        };
    }
}