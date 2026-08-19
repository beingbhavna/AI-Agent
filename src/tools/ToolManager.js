import CalculatorTool from "./calculator.tool.js";
import WeatherTool from "./weather.tool.js";
import DatabaseTool from "./ConversationCountTool.js";
import WebSearchTool from "./WebSearchTool.js";
import SQLTool from "./SQLTool.js";
import DatabaseSchemaTool from "./DatabaseSchemaTool.js";
export default class ToolManager {

    constructor() {
        this.tools = [new CalculatorTool(), new WeatherTool(), new DatabaseTool(), new WebSearchTool(), new SQLTool(), new DatabaseSchemaTool()];
    }

    getDefinitions() {
        return this.tools.map(tool => tool.getDefinition());
    }

    getTool(name) {
        return this.tools.find( tool =>tool.getDefinition().name === name);
    }

}