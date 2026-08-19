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

            // dependency resolution here...

            console.log(`🔧 Executing Tool: ${step.tool}`);
            console.log(`📥 Input: ${input}`);

            try {

                const result =
                    await this.toolExecutor.execute(
                        step.tool,
                        input
                    );

                console.log(`📤 Result:`, result);

                logTool(
                    step.tool,
                    input,
                    result
                );

                results.push({
                    step: step.step || i + 1,
                    tool: step.tool,
                    input,
                    result
                });

            } catch (error) {

                console.log(
                    `❌ Tool Error (${step.tool}):`,
                    error.message
                );

                results.push({
                    step: step.step || i + 1,
                    tool: step.tool,
                    input,
                    result: {
                        success: false,
                        error: error.message
                    }
                });
            }
        }

        return results;
    }
}