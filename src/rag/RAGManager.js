import ai from "../services/openai.service.js";
import EmbeddingService from "../embeddings/EmbeddingService.js";
import ChromaService from "../vectorstore/ChromaService.js";

export default class RAGManager {

    constructor() {
        this.embedding = new EmbeddingService();
        this.vector = new ChromaService();
    }

    async init() {
        await this.vector.init();
    }

    async search(query) {

        const embedding = await this.embedding.create(query);

        const result = await this.vector.search(embedding);

        if (!result.documents || result.documents.length === 0) {
            return "";
        }

        return {
            context: result.documents[0].join("\n"),
            sources: result.metadatas[0]
        };

    }

}