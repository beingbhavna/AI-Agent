import ChromaService from "../vectorstore/ChromaService.js";
import EmbeddingService from "../embeddings/EmbeddingService.js";

export default class DocumentSearchTool {

    constructor() {
        this.chroma = new ChromaService();
        this.embedding = new EmbeddingService();
    }

    getDefinition() {
        return {
            name: "document_search",
            description:
                "Search the user's uploaded documents using semantic similarity and return relevant document chunks."
        };
    }

    async execute(input, userId) {

        try {

            if (!input || !input.trim()) {
                throw new Error("Document search query is required.");
            }

            console.log("📄 Document Search Query:", input);

            // 1. Create embedding for user's question
            const queryEmbedding =
                await this.embedding.create(input);

            console.log("🧠 Query embedding created");

            // 2. Search Chroma
            const result = await this.chroma.search(
                queryEmbedding,
                userId,
                5
            );

            // 3. No results
            if (
                !result ||
                !result.documents ||
                !result.documents[0] ||
                result.documents[0].length === 0
            ) {
                return {
                    success: true,
                    count: 0,
                    documents: []
                };
            }

            // 4. Format results
            const documents = result.documents[0].map(
                (document, index) => ({
                    text: document,
                    metadata: result.metadatas?.[0]?.[index] || {},
                    distance: result.distances?.[0]?.[index] ?? null
                })
            );

            console.log(
                `📚 Retrieved ${documents.length} document chunks`
            );

            return {
                success: true,
                count: documents.length,
                documents
            };

        } catch (error) {

            console.error(
                "❌ Document Search Error:",
                error.message
            );

            return {
                success: false,
                error: error.message
            };
        }
    }
}