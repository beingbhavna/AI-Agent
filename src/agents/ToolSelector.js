import { retry } from "../utils/retry.js";
import { MODEL } from "../config/constants.js";

export default class ToolSelector {

    constructor(ai) {
        this.ai = ai;
    }

    async decide(message, tools) {

        const prompt = `
You are the Tool Selection Engine of BhavnaAI.

Available tools:
${JSON.stringify(tools, null, 2)}

User message:
"${message}"

Choose exactly ONE tool.

RULES:

1. calculator
Use for:
- arithmetic
- mathematical calculations
- percentages
- equations
- unit conversions

Return:
{
  "tool": "calculator",
  "input": "mathematical expression"
}

Example:
{
  "tool": "calculator",
  "input": "125 * 8"
}


2. weather
Use for:
- weather
- temperature
- rain
- humidity
- forecast
- wind

Return:
{
  "tool": "weather",
  "input": "city name"
}


3. web_search
Use for:
- latest information
- current information
- news
- sports scores
- stock prices
- cryptocurrency prices
- latest Angular/React/.NET versions
- anything requiring internet information

Return:
{
  "tool": "web_search",
  "input": "search query"
}


4. sql
Use ONLY when the user asks about data stored in the application's database.

Examples:
- How many messages do I have?
- Show my conversation history
- How many users are there?
- Show my messages

IMPORTANT:
Generate ONLY SELECT SQL queries.

For message-related questions, use the messages table.

Example:
{
  "tool": "sql",
  "input": "SELECT COUNT(*) AS total FROM messages WHERE user_id = 'bhavna';"
}


5. none
Use when:
- The answer can be obtained from the uploaded documents
- The user is having normal conversation
- No external tool is required

Return:
{
  "tool": "none",
  "input": ""
}


IMPORTANT:
- Return ONLY valid JSON.
- Return exactly one tool.
- Never use markdown.
- Never explain your decision.
`;

        const response = await retry(() =>
            this.ai.models.generateContent({
                model: MODEL,
                contents: prompt
            })
        );

        return response.text.trim();
    }
}