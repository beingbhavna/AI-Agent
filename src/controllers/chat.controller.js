import ai from "../services/openai.service.js";
import Agent from "../agents/Agent.js";

const agent = new Agent(ai);

export const chat = async (req, res) => {
    try {
        await agent.init();

        const { userId, message } = req.body;

        const answer = await agent.chat(userId, message);

        res.json({
            success: true,
            answer
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

}