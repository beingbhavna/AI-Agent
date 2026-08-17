export default class ToolExecutor {

    constructor(toolManager) {
        this.toolManager = toolManager;
    }

    async execute(toolName, input) {

        const tool = this.toolManager.getTool(toolName);

        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        return await tool.execute(input);
    }
}