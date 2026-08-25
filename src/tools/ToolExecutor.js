export default class ToolExecutor {

    constructor(toolManager) {
        this.toolManager = toolManager;
    }

    async execute(toolName, input, userId) {

        const tool = this.toolManager.getTool(toolName);

        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        console.log("🔧 Tool:", toolName);
        console.log("📥 Input:", input);
        console.log("👤 User:", userId);

        return await tool.execute(input, userId);
    }
}