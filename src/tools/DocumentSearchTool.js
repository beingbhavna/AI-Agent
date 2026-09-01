// import ChromaService from "../vectorstore/ChromaService.js";
// import EmbeddingService from "../embeddings/EmbeddingService.js";

// export default class DocumentSearchTool {

//     constructor() {

//         this.chroma = new ChromaService();
//         this.embedding = new EmbeddingService();

//     }

//     getDefinition() {

//         return {

//             name: "document_search",

//             description:
//                 "Search the user's uploaded documents using semantic similarity and return relevant document chunks."

//         };

//     }

//     async execute(input, userId) {

//         try {

//             // =========================================
//             // Normalize input
//             // =========================================

//             let query = input;

//             if (
//                 typeof input === "object" &&
//                 input !== null
//             ) {

//                 query = input.query;

//             }

//             if (
//                 typeof query !== "string" ||
//                 !query.trim()
//             ) {

//                 throw new Error(
//                     "Document search query is required."
//                 );

//             }

//             query = query.trim();

//             console.log(
//                 "📄 Document Search Query:",
//                 query
//             );

//             console.log(
//                 "👤 User:",
//                 userId
//             );


//             // =========================================
//             // Create query embedding
//             // =========================================

//             const queryEmbedding =
//                 await this.embedding.create(query);

//             console.log(
//                 "🧠 Query embedding created"
//             );


//             // =========================================
//             // Search Chroma
//             // =========================================

//             const result =
//                 await this.chroma.search(
//                     queryEmbedding,
//                     userId,
//                     5
//                 );


//             console.log(
//                 "📦 Chroma Search Result:",
//                 JSON.stringify(
//                     result,
//                     null,
//                     2
//                 )
//             );


//             // =========================================
//             // No results
//             // =========================================

//             if (
//                 !result ||
//                 !result.documents ||
//                 !result.documents[0] ||
//                 result.documents[0].length === 0
//             ) {

//                 console.log(
//                     "📭 No documents found"
//                 );

//                 return {

//                     success: true,

//                     count: 0,

//                     documents: []

//                 };

//             }


//             // =========================================
//             // Format documents
//             // =========================================

//             const documents =
//                 result.documents[0].map(
//                     (document, index) => ({

//                         text: document,

//                         metadata:
//                             result.metadatas?.[0]?.[index] || {},

//                         distance:
//                             result.distances?.[0]?.[index] ?? null

//                     })
//                 );


//             console.log(
//                 `📚 Retrieved ${documents.length} document chunks`
//             );


//             return {

//                 success: true,

//                 count: documents.length,

//                 documents

//             };

//         } catch (error) {

//             console.error(
//                 "❌ Document Search Error:",
//                 error.message
//             );

//             return {

//                 success: false,

//                 error: error.message

//             };

//         }

//     }

// }

import RAGManager from "../rag/RAGManager.js";

export default class DocumentSearchTool {

    constructor() {
        this.rag = new RAGManager();
    }

    // =========================================
    // Tool Definition
    // =========================================

    getDefinition() {

        return {
            name: "document_search",

            description:
                "Search the user's uploaded documents using semantic similarity. Use this tool when the user asks about information contained in their uploaded documents.",

            parameters: {
                type: "object",

                properties: {
                    query: {
                        type: "string",
                        description:
                            "The question or search query to find relevant information in the user's documents."
                    }
                },

                required: ["query"]
            }
        };
    }

    // =========================================
    // Initialize RAG
    // =========================================

    async init() {

        await this.rag.init();

        console.log(
            "🔎 Document Search Tool Initialized"
        );
    }

    // =========================================
    // Execute
    // =========================================

    async execute(input, userId) {

        try {

            console.log("🔧 Document Search Tool");
            console.log("📥 Input:", input);
            console.log("👤 User:", userId);

            // ---------------------------------------
            // 1. Extract query
            // ---------------------------------------

            let query;

            if (typeof input === "string") {

                query = input;

            }
            else if (
                input &&
                typeof input.query === "string"
            ) {

                query = input.query;

            }
            else {

                throw new Error(
                    "Invalid document search input. Expected string or { query: string }"
                );
            }

            query = query.trim();

            if (!query) {

                throw new Error(
                    "Search query cannot be empty"
                );
            }

            console.log(
                "🔎 Search Query:",
                query
            );

            // ---------------------------------------
            // 2. RAG Search
            // ---------------------------------------

            const result =
                await this.rag.search(
                    userId,
                    query
                );

            // ---------------------------------------
            // 3. Return result
            // ---------------------------------------

            console.log(
                `📚 Documents Found: ${result.sources?.length || 0}`
            );

            return {

                success: true,

                query,

                context:
                    result.context || "",

                sources:
                    result.sources || []

            };

        }
        catch (error) {

            console.error(
                "❌ Document Search Error:",
                error.message
            );

            return {

                success: false,

                error: error.message,

                context: "",

                sources: []

            };
        }
    }
}