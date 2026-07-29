import { retry } from "../utils/retry.js";
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
1. Return ONLY valid JSON.
2. If a tool is required, return:

{
  "tool":"calculator",
  "input":"25*40"
}

OR

{
  "tool":"weather",
  "input":"Delhi"
}

If no tool is required:

{
  "tool":"none"
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