import ai from "../services/openai.service.js";
import EmbeddingService from "../embeddings/EmbeddingService.js";

const embedder = new EmbeddingService(ai);

// const embedding = await embedder.createEmbedding(
//     "Angular is a frontend framework."
// );

// console.log(embedding.length);

const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: "Angular is a frontend framework."
});

console.log(response.embeddings[0].values.length);