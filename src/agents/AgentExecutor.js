import { logTool } from "../utils/logger.js";

export default class AgentExecutor {

    constructor(toolExecutor, selfCorrection) {
        this.toolExecutor = toolExecutor;
        this.selfCorrection = selfCorrection;
    }

    async execute(plan) {

        const results = [];

        if (!plan || !Array.isArray(plan.steps)) {
            return results;
        }

        for (let i = 0; i < plan.steps.length; i++) {

            const step = plan.steps[i];

            if (!step.tool) {
                continue;
            }

            let input = step.input || "";

            // ==========================================
            // Resolve dependency
            // ==========================================

            if (step.dependsOn) {

                const previousStep = results.find(
                    item => item.step === step.dependsOn
                );

                if (previousStep) {

                    const previousResult = previousStep.result;

                    if (
                        previousResult &&
                        previousResult.rows &&
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
                }
            }

            console.log(`🔧 Executing Tool: ${step.tool}`);
            console.log(`📥 Input: ${input}`);

            let result;

            try {

                // ==========================================
                // First Tool Execution
                // ==========================================

                result = await this.toolExecutor.execute(
                    step.tool,
                    input
                );

                console.log(`📤 Result:`, result);

                // ==========================================
                // Check Tool Failure
                // ==========================================

                if (
                    result &&
                    result.success === false &&
                    this.selfCorrection
                ) {

                    console.log(
                        `⚠️ Tool failed. Starting self-correction...`
                    );

                    try {

                        const correction =
                            await this.selfCorrection.correct(
                                step.tool,
                                input,
                                result.error
                            );

                        console.log(
                            `🧠 Correction Response:`,
                            correction
                        );

                        let correctionData;

                        try {

                            correctionData =
                                JSON.parse(correction);

                        } catch (error) {

                            console.log(
                                "❌ Invalid correction JSON"
                            );

                            correctionData = {
                                retry: false,
                                input: ""
                            };
                        }

                        // ==========================================
                        // Retry Corrected Input
                        // ==========================================

                        if (
                            correctionData.retry === true &&
                            correctionData.input
                        ) {

                            input = correctionData.input;

                            console.log(
                                `🔄 Retrying ${step.tool}`
                            );

                            console.log(
                                `📥 Corrected Input: ${input}`
                            );

                            result =
                                await this.toolExecutor.execute(
                                    step.tool,
                                    input
                                );

                            console.log(
                                `📤 Retry Result:`,
                                result
                            );

                        }

                    } catch (correctionError) {

                        console.log(
                            `❌ Self-Correction Error:`,
                            correctionError.message
                        );

                    }
                }

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

                // ==========================================
                // Self-Correction for thrown errors
                // ==========================================

                if (this.selfCorrection) {

                    try {

                        console.log(
                            `🧠 Attempting self-correction...`
                        );

                        const correction =
                            await this.selfCorrection.correct(
                                step.tool,
                                input,
                                error.message
                            );

                        let correctionData;

                        try {

                            correctionData =
                                JSON.parse(correction);

                        } catch (parseError) {

                            correctionData = {
                                retry: false,
                                input: ""
                            };

                        }

                        if (
                            correctionData.retry === true &&
                            correctionData.input
                        ) {

                            input = correctionData.input;

                            console.log(
                                `🔄 Retrying ${step.tool}`
                            );

                            console.log(
                                `📥 Corrected Input: ${input}`
                            );

                            result =
                                await this.toolExecutor.execute(
                                    step.tool,
                                    input
                                );

                            console.log(
                                `📤 Retry Result:`,
                                result
                            );
                        }

                    } catch (correctionError) {

                        console.log(
                            `❌ Self-Correction Failed:`,
                            correctionError.message
                        );
                    }
                }
            }

            // ==========================================
            // Save Result
            // ==========================================

            results.push({

                step: step.step || i + 1,

                tool: step.tool,

                input,

                result

            });
        }

        return results;
    }
}