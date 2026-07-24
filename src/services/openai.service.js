import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default client;