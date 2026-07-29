export default class WebSearchTool {

    getDefinition() {
        return {
            name: "web_search",
            description: "Searches the web for recent information."
        };
    }

    async execute(query) {

        // Call search API here

        return {
            success: true,
            results: []
        };

    }

}