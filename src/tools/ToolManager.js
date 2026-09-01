import CalculatorTool from "./calculator.tool.js";
import WeatherTool from "./weather.tool.js";
import DatabaseTool from "./ConversationCountTool.js";
import WebSearchTool from "./WebSearchTool.js";
import SQLTool from "./SQLTool.js";
import DatabaseSchemaTool from "./DatabaseSchemaTool.js";
import DocumentSearchTool from "./DocumentSearchTool.js";
export default class ToolManager {

    constructor() {
        this.tools = [new CalculatorTool(), new WeatherTool(), new DatabaseTool(), new WebSearchTool(), new SQLTool(), new DatabaseSchemaTool(), new DocumentSearchTool()];
    }

    getDefinitions() {
        return this.tools.map((tool, index) => {
            console.log(
                `🔧 Tool ${index + 1}:`,
                tool?.constructor?.name,
                "| getDefinition:",
                typeof tool?.getDefinition
            );

            if (typeof tool?.getDefinition !== "function") {
                throw new Error(
                    `Tool ${tool?.constructor?.name || "Unknown"} does not have getDefinition()`
                );
            }

            return tool.getDefinition();
        });
    }

    getTool(name) {
        return this.tools.find(tool => tool.getDefinition().name === name);
    }

}