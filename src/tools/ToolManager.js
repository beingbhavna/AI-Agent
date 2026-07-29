import CalculatorTool from "./calculator.tool.js";
import WeatherTool from "./weather.tool.js";
import DatabaseTool from "./database.tool.js";
export default class ToolManager {

    constructor() {
        this.tools = [new CalculatorTool(), new WeatherTool(), new DatabaseTool()];
    }

    getDefinitions() {
        return this.tools.map(tool => tool.getDefinition());
    }

    getTool(name) {
        return this.tools.find( tool =>tool.getDefinition().name === name);
    }

}