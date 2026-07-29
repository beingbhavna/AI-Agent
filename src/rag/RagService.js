import ai from "../services/openai.service.js";
import EmbeddingService from "../embeddings/EmbeddingService.js";
import ChromaService from "../vectorstore/ChromaService.js";
export default class RagService {

    constructor(ai) {
        this.embedder = new EmbeddingService(ai);
        this.chroma = new ChromaService();
        this.vector = new ChromaService();
    }

    async init() {
        await this.chroma.init();
    }

    async search(question) {

        const embedding = await this.embedder.create(question);

        const result = await this.chroma.search(embedding, 5);

        if (!result.documents || result.documents.length === 0) {
            return "";
        }

        return result.documents[0].join("\n\n");
    }

}