import ai from "../services/openai.service.js";
import EmbeddingService from "../embeddings/EmbeddingService.js";

const embedder = new EmbeddingService(ai);

const embedding = await embedder.createEmbedding(
    "Angular is a frontend framework."
);

console.log(embedding.length);