import express from "express";
import dotenv from "dotenv";
import client from "./services/openai.service.js";
import Agent from "./agents/Agent.js";
import ai from "./services/openai.service.js";
import { chat } from "./controllers/chat.controller.js";
import chatRoutes from "./routes/chat.routes.js";
const router = express.Router();

router.post("/chat", chat);

export default router;
// dotenv.config();
const app = express();
app.use(express.json());
app.use("/api", chatRoutes);
const agent = new Agent(ai);

async function main() {
    try {
        const response = await client.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Explain AI Agents in simple words.",
        });

        console.log(response.text);
    } catch (error) {
        console.error(error);
    }
}
main();

app.get("/", async (req, res) => {
    const answer = await agent.chat("Explain AI Agents in simple words.");
    res.json({ success: true, answer: answer });
});

app.listen(process.env.PORT, () => {
    console.log("Server Running");
});