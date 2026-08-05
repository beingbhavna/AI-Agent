import { retry } from "../utils/retry.js";
import { MODEL } from "../config/constants.js";

export default class ToolSelector {

  constructor(ai) {
    this.ai = ai;
  }

  async decide(message, tools) {

    const prompt = `
You are an AI Agent.

Your job is to decide whether a tool should be used.

Available tools:

${JSON.stringify(tools, null, 2)}

User Message:
"${message}"

Rules:

1. If the user wants to perform mathematical calculations, arithmetic, percentages, equations, or conversions, return:

{
  "tool": "calculator",
  "input": "<mathematical expression>"
}

Examples:
User: Calculate 25 * 5
Output:
{
  "tool":"calculator",
  "input":"25 * 5"
}

--------------------------------------

2. If the user asks about weather, temperature, humidity, rain, forecast, climate, or wind, return:

{
  "tool":"weather",
  "input":"<city name>"
}

Examples:
User: Weather in Delhi
Output:
{
  "tool":"weather",
  "input":"Delhi"
}

--------------------------------------

3. If the user asks about:

- latest news
- current events
- today's news
- sports scores
- cricket score
- football score
- stock market
- stock price
- cryptocurrency
- bitcoin price
- latest software versions
- latest Angular version
- latest React version
- latest .NET version
- latest AI news
- anything requiring current internet information

Return:

{
  "tool":"web_search",
  "input":"<search query>"
}
4.If the user asks anything about database data,
use the SQL tool.

Examples:

User:
How many messages do I have?

Output:

{
"tool":"sql",
"input":"SELECT COUNT(*) AS total FROM messages;"
}

User:
Show all messages

Output:

{
"tool":"sql",
"input":"SELECT * FROM messages ORDER BY created_at DESC;"
}

User:
Show only user messages

Output:

{
"tool":"sql",
"input":"SELECT * FROM messages WHERE role='user';"
}

User:
Show assistant replies

Output:

{
"tool":"sql",
"input":"SELECT * FROM messages WHERE role='assistant';"
}

User:
Latest message

Output:

{
"tool":"sql",
"input":"SELECT * FROM messages ORDER BY created_at DESC LIMIT 1;"
}

User:
How many users?

Output:

{
"tool":"sql",
"input":"SELECT COUNT(DISTINCT user_id) AS total_users FROM messages;"
}If the user asks anything about database data,
use the SQL tool.

Examples:

User:
How many messages do I have?

Output:

{
"tool":"sql",
"input":"SELECT COUNT(*) AS total FROM messages;"
}

User:
Show all messages

Output:

{
"tool":"sql",
"input":"SELECT * FROM messages ORDER BY created_at DESC;"
}

User:
Show only user messages

Output:

{
"tool":"sql",
"input":"SELECT * FROM messages WHERE role='user';"
}

User:
Show assistant replies

Output:

{
"tool":"sql",
"input":"SELECT * FROM messages WHERE role='assistant';"
}

User:
Latest message

Output:

{
"tool":"sql",
"input":"SELECT * FROM messages ORDER BY created_at DESC LIMIT 1;"
}

User:
How many users?

Output:

{
"tool":"sql",
"input":"SELECT COUNT(DISTINCT user_id) AS total_users FROM messages;"
}
Example:

User: Latest Angular version

Output:
{
  "tool":"web_search",
  "input":"Latest Angular version"
}

--------------------------------------

4. If no tool is required, return:

{
  "tool":"none",
  "input":""
}

IMPORTANT:
- Return ONLY valid JSON.
- Do not explain your decision.
- Do not use markdown.
- Do not add extra text.
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