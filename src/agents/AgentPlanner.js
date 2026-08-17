import { retry } from "../utils/retry.js";
import { MODEL } from "../config/constants.js";

export default class AgentPlanner {

    constructor(ai) {
        this.ai = ai;
    }

    async plan(message, tools) {

        const prompt = `
You are the planning engine of BhavnaAI.

Your job is to decide which tools are required to answer the user's request.

Available tools:

${JSON.stringify(tools, null, 2)}

User request:

"${message}"

Rules:

1. If no tool is required, return:
{
    "steps": []
}

2. If one tool is required, return one step.

3. If multiple independent tools are required, return multiple steps.

4. Execute steps in logical order.

5. If a later step needs the result of an earlier step, mark it with:
"dependsOn": <previous step number>

6. Step numbers start from 1.

7. Never create tools that are not present in the available tools.

8. For SQL, generate ONLY SELECT queries.

9. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, GRANT or REVOKE.

10. Do not answer the user.

11. Return ONLY valid JSON.

Return exactly this structure:

{
    "steps": [
        {
            "step": 1,
            "tool": "tool_name",
            "input": "tool input",
            "dependsOn": null
        }
    ]
}


Example 1:

User:
"Calculate 25 * 8"

Return:

{
    "steps": [
        {
            "step": 1,
            "tool": "calculator",
            "input": "25 * 8",
            "dependsOn": null
        }
    ]
}


Example 2:

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


Example 3:

User:
"Calculate 20% of 500 and tell me today's weather in Delhi"

Return:

{
    "steps": [
        {
            "step": 1,
            "tool": "calculator",
            "input": "20% of 500",
            "dependsOn": null
        },
        {
            "step": 2,
            "tool": "weather",
            "input": "Delhi",
            "dependsOn": null
        }
    ]
}


Example 4:

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