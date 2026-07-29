import ai from "../services/openai.service.js";
import { randomUUID } from "crypto";
import ChromaService from "../vectorstore/ChromaService.js";

const chroma = new ChromaService();

await chroma.init();

const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: "Angular Dependency Injection is awesome."
});

const embedding = response.embeddings[0].values;

await chroma.addDocument(
    randomUUID(),
    embedding,
    "Angular Dependency Injection is awesome."
);

console.log("✅ Stored Successfully");