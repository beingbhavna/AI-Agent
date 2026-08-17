import express from "express";
import dotenv from "dotenv";

import db from "./config/db.js";

import chatRoutes from "./routes/chat.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

dotenv.config();

try {
    await db.getConnection();
    console.log("✅ MySQL Connected");
} catch (err) {
    console.log(err);
}

const app = express();

app.use(express.json());

app.use("/api", chatRoutes);
app.use("/api", uploadRoutes);

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "AI Agent Server Running 🚀"
    });

});
app.get("/health", async (req, res) => {

    res.json({
        success: true,
        service: "BhavnaAI",
        status: "healthy",
        timestamp: new Date().toISOString()
    });

});

app.listen(process.env.PORT, () => {
    console.log("✅ Server Running");
});