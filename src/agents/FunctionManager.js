export default class FunctionManager {

    constructor(toolManager) {
        this.toolManager = toolManager;
    }

    getFunctions() {

        return this.toolManager.getDefinitions();

    }

}