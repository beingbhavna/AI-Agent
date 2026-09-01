import axios from "axios";

export default class WebSearchTool {

    getDefinition() {
        return {
            name: "web_search",
            description: "Searches the web for recent information.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to send to the web search engine."
                    }
                },
                required: ["query"]
            }
        };
    }
    async execute(query) {

        try {

            const response = await axios.post(
                "https://api.tavily.com/search",
                {
                    api_key: process.env.TAVILY_API_KEY,
                    query: query,
                    max_results: 5
                }
            );

            console.log("Tavily Response:");
            console.log(JSON.stringify(response.data, null, 2));

            return {
                success: true,
                results: response.data.results || []
            };

        } catch (error) {

            console.error("Tavily Error:");

            if (error.response) {
                console.error(error.response.data);
            } else {
                console.error(error.message);
            }

            return {
                success: false,
                error: error.message
            };
        }
    }
}