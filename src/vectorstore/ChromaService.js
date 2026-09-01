import { ChromaClient } from "chromadb";

export default class ChromaService {

    constructor() {

        this.client = new ChromaClient({
            host: "localhost",
            port: 8000,
            ssl: false
        });

        this.collection = null;
    }


    // =========================================================
    // INITIALIZE COLLECTION
    // =========================================================

    async init() {

        if (this.collection) {
            return this.collection;
        }

        try {

            console.log("🔌 Connecting to ChromaDB...");
            console.log("🌐 Chroma URL: http://localhost:8000");

            this.collection =
                await this.client.getOrCreateCollection({
                    name: "documents",
                    embeddingFunction: null
                });

            console.log("✅ Chroma Collection Ready");

            return this.collection;

        } catch (error) {

            console.error(
                "❌ Chroma Connection Failed:",
                error.message
            );

            throw error;
        }
    }


    // =========================================================
    // ADD DOCUMENT
    // =========================================================

    async addDocument(
        id,
        embedding,
        text,
        metadata
    ) {

        await this.init();

        if (!id) {
            throw new Error("Document ID is required");
        }

        if (!embedding || !Array.isArray(embedding)) {
            throw new Error("Valid embedding is required");
        }

        if (!text) {
            throw new Error("Document text is required");
        }

        if (!metadata) {
            metadata = {};
        }

        console.log("📥 Adding document to Chroma:");
        console.log("   ID:", id);
        console.log("   User:", metadata.userId);
        console.log("   File:", metadata.fileName);
        console.log("   Chunk:", metadata.chunk);

        await this.collection.add({

            ids: [id],

            embeddings: [embedding],

            documents: [text],

            metadatas: [metadata]

        });

        console.log("✅ Document chunk inserted");
    }


    // =========================================================
    // SEARCH DOCUMENT
    // =========================================================

    async search(
        embedding,
        userId,
        limit = 5
    ) {

        await this.init();

        if (!embedding || !Array.isArray(embedding)) {
            throw new Error("Valid query embedding is required");
        }

        if (!userId) {
            throw new Error("userId is required for document search");
        }

        console.log("🔎 Chroma Search");
        console.log("👤 User:", userId);
        console.log("🔢 Limit:", limit);

        const result =
            await this.collection.query({

                queryEmbeddings: [embedding],

                nResults: limit,

                where: {
                    userId: userId
                },

                include: [
                    "documents",
                    "metadatas",
                    "distances"
                ]
            });

        console.log(
            "📦 Chroma Search Result:",
            JSON.stringify(
                result,
                null,
                2
            )
        );

        return result;
    }


    // =========================================================
    // GET COLLECTION COUNT
    // =========================================================

    async count() {

        await this.init();

        return await this.collection.count();
    }


    // =========================================================
    // GET ALL DOCUMENTS
    // =========================================================

    async getAll() {
        await this.init();
        return await this.collection.get({
            include: [
                "documents",
                "metadatas"
            ]
        });
    }
}