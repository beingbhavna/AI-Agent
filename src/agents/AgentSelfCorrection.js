import { retry } from "../utils/retry.js";
import { MODEL } from "../config/constants.js";

export default class AgentSelfCorrection {

    constructor(ai) {
        this.ai = ai;
    }

    async correct(tool, input, error) {

        const prompt = `
You are the self-correction engine of BhavnaAI.

A tool execution failed.

Tool:
${tool}

Original Input:
${input}

Error:
${error}

Your job is to fix the tool input.

Rules:

1. Return ONLY valid JSON.
2. Do not explain anything.
3. Keep the same tool.
4. Do not create a new tool.
5. For SQL, generate ONLY SELECT queries.
6. If the input cannot be fixed, return:
{
  "retry": false,
  "input": ""
}

Otherwise return:

{
  "retry": true,
  "input": "corrected input"
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