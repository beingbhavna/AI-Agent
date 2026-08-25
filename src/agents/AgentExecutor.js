import { logTool } from "../utils/logger.js";

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
    }


    async execute(plan, userId) {

        const results = [];

        if (!plan || !Array.isArray(plan.steps)) {
            return results;
        }

        for (let i = 0; i < plan.steps.length; i++) {

            const step = plan.steps[i];

            if (!step || !step.tool) {
                continue;
            }

            let input = step.input ?? "";


            // ==========================================
            // Resolve dependency
            // ==========================================

            if (step.dependsOn) {

                const previousStep = results.find(
                    item => item.step === step.dependsOn
                );

                if (previousStep) {

                    const previousResult = previousStep.result;


                    // ==========================================
                    // SQL rows result
                    // ==========================================

                    if (
                        previousResult &&
                        Array.isArray(previousResult.rows) &&
                        previousResult.rows.length > 0
                    ) {

                        const row = previousResult.rows[0];

                        for (const key of Object.keys(row)) {

                            const placeholder =
                                `{{step${step.dependsOn}.${key}}}`;

                            input = input.replace(
                                placeholder,
                                String(row[key])
                            );
                        }
                    }


                    // ==========================================
                    // Direct result
                    // ==========================================

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

                result = await this.toolExecutor.execute(
                    step.tool,
                    input,
                    userId
                );


                logTool(
                    step.tool,
                    input,
                    result
                );

            } catch (error) {

                console.log(
                    `❌ Tool Error (${step.tool}):`,
                    error.message
                );

                result = {
                    success: false,
                    error: error.message
                };
            }


            // ==========================================
            // Store Result
            // ==========================================

            results.push({
                step: step.step ?? i + 1,
                tool: step.tool,
                input,
                result
            });
        }


        return results;
    }
}