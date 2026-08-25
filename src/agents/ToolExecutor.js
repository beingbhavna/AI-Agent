export default class ToolExecutor {

    constructor(toolManager) {
        this.toolManager = toolManager;
    }

    async execute(toolName, input,userId) {

        const tool = this.toolManager.getTool(toolName);

        if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
        }

        console.log(`🔧 Tool: ${toolName}`);
        console.log(`📥 Input: ${input}`);

        try {

            const result = await Promise.race([

                tool.execute(input,userId),

                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(
                            new Error("Tool execution timeout")
                        ),
                        15000
                    )
                )

            ]);

            console.log("📤 Result:", result);

            return result;

        } catch (error) {

            console.error(
                `❌ Tool ${toolName} failed:`,
                error.message
            );

            return {
                success: false,
                error: error.message
            };
        }
    }
}