import ai from "../services/openai.service.js";
import ChromaService from "../vectorstore/ChromaService.js";

const chroma = new ChromaService();

await chroma.init();

const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: "What is Dependency Injection?"
});

const embedding = response.embeddings[0].values;

const result = await chroma.search(embedding);

console.log(result.documents);