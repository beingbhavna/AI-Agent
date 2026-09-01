// import EmbeddingService from "../embeddings/EmbeddingService.js";
// import ChromaService from "../vectorstore/ChromaService.js";
// import DocumentSearchTool from "../tools/DocumentSearchTool.js";
// import RAGContextBuilder from "./RAGContextBuilder.js";
// import RAGPromptBuilder from "./RAGPromptBuilder.js";

// export default class RAGManager {

//     constructor() {

//         this.embedding = new EmbeddingService();

//         this.vector = new ChromaService();

//         this.documentSearch =
//             new DocumentSearchTool();

//         this.contextBuilder =
//             new RAGContextBuilder();

//         this.promptBuilder =
//             new RAGPromptBuilder();
//     }


//     // =========================================================
//     // INITIALIZE RAG
//     // =========================================================

//     async init() {

//         try {

//             await this.vector.init();

//             console.log(
//                 "📚 RAG Manager Initialized"
//             );

//         } catch (error) {

//             console.error(
//                 "❌ RAG Manager Initialization Error:",
//                 error.message
//             );

//             throw error;
//         }
//     }


//     // =========================================================
//     // SEARCH KNOWLEDGE BASE
//     // =========================================================

//     async search(userId, query) {

//         try {

//             if (!userId) {
//                 throw new Error(
//                     "userId is required for RAG search"
//                 );
//             }

//             if (!query || !query.trim()) {
//                 throw new Error(
//                     "Search query is required"
//                 );
//             }


//             console.log(
//                 "🔎 RAG Search:",
//                 query
//             );

//             console.log(
//                 "👤 RAG User:",
//                 userId
//             );


//             // =================================================
//             // 1. Create query embedding
//             // =================================================

//             const embedding =
//                 await this.embedding.create(query);

//             console.log(
//                 "🧠 RAG Query Embedding Created"
//             );


//             // =================================================
//             // 2. Search Chroma
//             // =================================================

//             const result =
//                 await this.vector.search(
//                     embedding,
//                     userId,
//                     5
//                 );


//             // =================================================
//             // 3. Check search result
//             // =================================================

//             if (
//                 !result ||
//                 !result.documents ||
//                 !result.documents[0] ||
//                 result.documents[0].length === 0
//             ) {

//                 console.log(
//                     "📭 No relevant documents found"
//                 );

//                 return {
//                     context: "",
//                     sources: [],
//                     results: []
//                 };
//             }


//             // =================================================
//             // 4. Convert Chroma result into standard format
//             // =================================================

//             const documents =
//                 result.documents[0] || [];

//             const metadatas =
//                 result.metadatas?.[0] || [];

//             const distances =
//                 result.distances?.[0] || [];


//             const searchResults =
//                 documents.map(
//                     (document, index) => {

//                         return {

//                             text: document,

//                             metadata:
//                                 metadatas[index] || {},

//                             distance:
//                                 distances[index] ?? null
//                         };
//                     }
//                 );


//             console.log(
//                 `📚 Retrieved ${searchResults.length} document chunks`
//             );


//             // =================================================
//             // 5. Build RAG Context
//             // =================================================

//             const contextResult =
//                 this.contextBuilder.build(
//                     searchResults
//                 );


//             console.log(
//                 "🧱 RAG Context Built"
//             );


//             // =================================================
//             // 6. Return RAG data
//             // =================================================

//             return {

//                 context:
//                     contextResult?.context || "",

//                 sources:
//                     contextResult?.sources || [],

//                 results:
//                     searchResults
//             };


//         } catch (error) {

//             console.error(
//                 "❌ RAG Search Error:",
//                 error.message
//             );

//             return {

//                 context: "",

//                 sources: [],

//                 results: [],

//                 error: error.message
//             };
//         }
//     }


//     // =========================================================
//     // BUILD RAG PROMPT
//     // =========================================================

//     buildPrompt(userMessage, context) {

//         if (!userMessage) {

//             throw new Error(
//                 "User message is required"
//             );
//         }


//         return this.promptBuilder.build(
//             userMessage,
//             context || ""
//         );
//     }
// }

import EmbeddingService from "../embeddings/EmbeddingService.js";
import ChromaService from "../vectorstore/ChromaService.js";

export default class RAGManager {

    constructor() {
        this.embedding = new EmbeddingService();
        this.vector = new ChromaService();
    }

    async init() {

        await this.vector.init();

        console.log("📚 RAG Manager Initialized");
    }

    async search(userId, query) {

        console.log("🔎 RAG Search:", query);
        console.log("👤 RAG User:", userId);

        // ---------------------------------------
        // 1. Create query embedding
        // ---------------------------------------

        const embedding =
            await this.embedding.create(query);

        console.log("🧠 Query Embedding Created");

        // ---------------------------------------
        // 2. Search Chroma
        // ---------------------------------------

        const result =
            await this.vector.search(
                embedding,
                userId,
                5
            );

        // ---------------------------------------
        // 3. Check results
        // ---------------------------------------

        if (
            !result.documents ||
            !result.documents[0] ||
            result.documents[0].length === 0
        ) {

            console.log("📭 No relevant documents found");

            return {
                context: "",
                sources: []
            };
        }

        // ---------------------------------------
        // 4. Extract results
        // ---------------------------------------

        const documents =
            result.documents[0];

        const metadatas =
            result.metadatas?.[0] || [];

        // ---------------------------------------
        // 5. Build context
        // ---------------------------------------

        let context = "";

        for (let i = 0; i < documents.length; i++) {

            const document =
                documents[i];

            const metadata =
                metadatas[i] || {};

            context += `
Source: ${metadata.fileName || "Unknown"}
Chunk: ${metadata.chunk ?? i + 1}

${document}

----------------------------------------
`;
        }

        console.log(
            `📚 RAG Documents Found: ${documents.length}`
        );

        return {
            context,
            sources: metadatas
        };
    }
}