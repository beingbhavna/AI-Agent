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

        // Tune this later based on your embedding model
        this.maxDistance = 0.70;

        // Retrieve more candidates before filtering
        this.topK = 10;

        // Final number of chunks sent to LLM
        this.finalK = 5;
    }

    async init() {
        await this.vector.init();

        console.log("📚 RAG Manager Initialized");
    }

    async search(userId, query,documentId = null) {

        try {

            // ---------------------------------------
            // 1. Validate input
            // ---------------------------------------

            if (!userId) {
                throw new Error("userId is required for RAG search");
            }

            if (!query || !query.trim()) {
                throw new Error("Search query is required");
            }

            query = query.trim();

            console.log("🔎 RAG Search:", query);
            console.log("👤 RAG User:", userId);

            // ---------------------------------------
            // 2. Create query embedding
            // ---------------------------------------

            const embedding =
                await this.embedding.create(query);

            console.log("🧠 Query Embedding Created");

            // ---------------------------------------
            // 3. Search Chroma
            // ---------------------------------------

            const result = await this.vector.search(
                    embedding,
                    userId,
                    documentId,
                    this.topK
                );

            // ---------------------------------------
            // 4. Check results
            // ---------------------------------------

            if (
                !result ||
                !result.documents ||
                !result.documents[0] ||
                result.documents[0].length === 0
            ) {

                console.log("📭 No documents found");

                return {
                    context: "",
                    sources: [],
                    results: []
                };
            }

            // ---------------------------------------
            // 5. Extract Chroma results
            // ---------------------------------------

            const documents =
                result.documents[0] || [];

            const metadatas =
                result.metadatas?.[0] || [];

            const distances =
                result.distances?.[0] || [];

            // ---------------------------------------
            // 6. Convert results
            // ---------------------------------------

            let searchResults =
                documents.map((document, index) => {

                    return {
                        text: document,

                        metadata:
                            metadatas[index] || {},

                        distance:
                            distances[index] ?? null
                    };

                });

            console.log(
                `📚 Retrieved ${searchResults.length} candidates`
            );

            // ---------------------------------------
            // 7. Distance filtering
            // ---------------------------------------

            searchResults =
                searchResults.filter(item => {

                    if (item.distance === null) {
                        return true;
                    }

                    return item.distance <= this.maxDistance;
                });

            console.log(
                `🎯 Relevant chunks after filtering: ${searchResults.length}`
            );

            // ---------------------------------------
            // 8. Limit final results
            // ---------------------------------------

            searchResults =
                searchResults.slice(0, this.finalK);

            // ---------------------------------------
            // 9. No relevant result
            // ---------------------------------------

            if (searchResults.length === 0) {

                console.log(
                    "📭 No sufficiently relevant documents found"
                );

                return {
                    context: "",
                    sources: [],
                    results: []
                };
            }

            // ---------------------------------------
            // 10. Build context
            // ---------------------------------------

            let context = "";

            for (const item of searchResults) {

                const metadata =
                    item.metadata || {};

                context += `
Source: ${metadata.fileName || "Unknown"}
Chunk: ${metadata.chunkIndex ?? metadata.chunk ?? "Unknown"}

${item.text}

----------------------------------------
`;
            }

            // ---------------------------------------
            // 11. Build sources
            // ---------------------------------------

            const sources =
                searchResults.map(item => ({
                    fileName:
                        item.metadata?.fileName || "Unknown",

                    chunkIndex:
                        item.metadata?.chunkIndex ??
                        item.metadata?.chunk ??
                        null,

                    distance:
                        item.distance
                }));

            console.log(
                `📚 Final RAG Documents: ${searchResults.length}`
            );

            // ---------------------------------------
            // 12. Return
            // ---------------------------------------

            return {

                context,

                sources,

                results: searchResults

            };

        } catch (error) {

            console.error(
                "❌ RAG Search Error:",
                error.message
            );

            return {

                context: "",

                sources: [],

                results: [],

                error: error.message

            };
        }
    }
}