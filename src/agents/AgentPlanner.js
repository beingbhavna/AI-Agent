import { retry } from "../utils/retry.js";
import { MODEL } from "../config/constants.js";

export default class AgentPlanner {

    constructor(ai) {
        this.ai = ai;
    }

    async plan(message, tools, schema = null, previousResults = []) {

        const schemaText = schema
            ? JSON.stringify(schema, null, 2)
            : "Database schema not available.";

        const prompt = `
You are the planning engine of BhavnaAI.

Your job is to decide which tools are required to answer the user's request.

Available tools:
${JSON.stringify(tools, null, 2)}

PREVIOUS TOOL RESULTS:
${JSON.stringify(previousResults, null, 2)}

DATABASE SCHEMA:
${schemaText}

USER REQUEST:
"${message}"

RULES:

1. If no tool is required, return:

{
    "steps": []
}

2. If a tool is required, create the required step.

3. If multiple tools are required, execute them in logical order.

4. Never create a tool that is not present in Available tools.

5. For database questions:

   - First use "database_schema" if the schema is not already provided.
   - Then use "sql".
   - SQL must use ONLY tables and columns that exist in the provided schema.

6. SQL rules:

   - ONLY SELECT queries are allowed.
   - Never generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE or GRANT.
   - Use the exact table names from the schema.
   - Use the exact column names from the schema.

7. For calculations, use "calculator".

8. For weather questions, use "weather".

9. For current internet information, use "web_search".

10. If a later step depends on an earlier step, use:

"dependsOn": <step number>

and reference values using:

{{step1.total}}

Example:

User:
"How many messages do I have?"

Return:

{
    "steps": [
        {
            "step": 1,
            "tool": "sql",
            "input": "SELECT COUNT(*) AS total FROM messages WHERE user_id = 'bhavna'",
            "dependsOn": null
        }
    ]
}
11. Use previous tool results when the user refers to information
    from the previous conversation.

12. Words such as:
    - it
    - that
    - this
    - the result
    - previous result
    - those messages
    - that number

    may refer to a previous tool result.

13. If the required information already exists in PREVIOUS TOOL RESULTS,
    do NOT execute the same tool again.

14. You may use the previous result directly in a calculator step.

15. If the previous result contains:

{
    "total": 56
}

and the user asks:

"Is that greater than 20?"

return:

{
    "steps": [
        {
            "step": 1,
            "tool": "calculator",
            "input": "56 > 20",
            "dependsOn": null
        }
    ]
}

Example:

User:
"Find how many messages I have and tell me if the number is greater than 20"

Return:

{
    "steps": [
        {
            "step": 1,
            "tool": "sql",
            "input": "SELECT COUNT(*) AS total FROM messages WHERE user_id = 'bhavna'",
            "dependsOn": null
        },
        {
            "step": 2,
            "tool": "calculator",
            "input": "{{step1.total}} > 20",
            "dependsOn": 1
        }
    ]
}

IMPORTANT:

Return ONLY valid JSON.

Do not use markdown.

Do not explain your decision.

Do not add extra text.
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