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

    async search(userId, query) {

        // Create embedding for the user's query
        const embedding = await this.embedding.create(query);

        // Search ChromaDB
        const result = await this.vector.search(embedding, userId);

        // No documents found
        if (
            !result.documents ||
            result.documents.length === 0 ||
            result.documents[0].length === 0
        ) {
            return {
                context: "",
                sources: []
            };
        }

        const documents = result.documents[0];
        const metadatas = result.metadatas[0];

        // Build context with source information
        let context = "";

        for (let i = 0; i < documents.length; i++) {

            const meta = metadatas[i];

            context += `
Source: ${meta.fileName}
Chunk: ${meta.chunk}

${documents[i]}

----------------------------------------
`;

        }

        return {
            context,
            sources: metadatas
        };

    }

}