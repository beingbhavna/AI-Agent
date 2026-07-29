import { ChromaClient } from "chromadb";

export default class ChromaService {

    constructor() {

        this.client = new ChromaClient({
            path: "http://localhost:8000"
        });

        this.collection = null;
    }

    async init() {

        if (this.collection) {
            return;
        }

        try {

            this.collection = await this.client.getOrCreateCollection({
                name: "documents",
                embeddingFunction: null
            });
            console.log("✅ Chroma Collection Ready");

        } catch (error) {

            console.error("❌ Chroma Connection Failed");
            console.error(error.message);
            throw error;

        }

    }

    async addDocument(id, embedding, text, metadata) {
        await this.init();
        await this.collection.add({
            ids: [id],
            embeddings: [embedding],
            documents: [text],
            metadatas: [metadata]
        });

    }

    async search(embedding, limit = 5) {

        await this.init();

        return await this.collection.query({
            queryEmbeddings: [embedding],
            nResults: limit,
            include: ["documents", "metadatas"]
        });

    }

}