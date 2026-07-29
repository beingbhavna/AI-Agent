import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import chatRoutes from "./routes/chat.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

dotenv.config();

await connectDB();

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

app.listen(process.env.PORT, () => {
    console.log("✅ Server Running");
});