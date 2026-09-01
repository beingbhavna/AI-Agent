import PdfLoader from "./PdfLoader.js";
import TextSplitter from "./TextSplitter.js";
import EmbeddingService from "../embeddings/EmbeddingService.js";
import ChromaService from "../vectorstore/ChromaService.js";
import { randomUUID } from "crypto";

export default class DocumentIngestionService {

    constructor() {
        this.loader = new PdfLoader();
        this.splitter = new TextSplitter();
        this.embedder = new EmbeddingService();
        this.chroma = new ChromaService();
    }

    async ingest(filePath, fileName, userId) {

        console.log("📄 Starting document ingestion...");
        console.log("📁 File:", filePath);
        console.log("📄 File Name:", fileName);
        console.log("👤 User:", userId);

        try {

            // ==========================================
            // 1. Extract PDF text
            // ==========================================

            const text =
                await this.loader.load(filePath);

            if (!text || !text.trim()) {

                throw new Error(
                    "No text could be extracted from the document."
                );

            }

            console.log(
                `📖 Extracted ${text.length} characters`
            );


            // ==========================================
            // 2. Split text into chunks
            // ==========================================

            const chunks =
                await this.splitter.split(text);

            if (!Array.isArray(chunks) || chunks.length === 0) {

                throw new Error(
                    "Document was extracted but no chunks were created."
                );

            }

            console.log(
                `✂️ Created ${chunks.length} chunks`
            );


            // ==========================================
            // 3. Initialize Chroma
            // ==========================================

            await this.chroma.init();

            console.log(
                "🗄️ Chroma ready for document storage"
            );


            // ==========================================
            // 4. Create embeddings and store chunks
            // ==========================================

            for (let i = 0; i < chunks.length; i++) {

                const chunk = chunks[i];

                console.log(
                    `🧠 Creating embedding ${i + 1}/${chunks.length}`
                );

                const embedding =
                    await this.embedder.create(chunk);

                if (
                    !embedding ||
                    !Array.isArray(embedding) ||
                    embedding.length === 0
                ) {

                    throw new Error(
                        `Invalid embedding generated for chunk ${i + 1}`
                    );

                }

                console.log(
                    `📏 Embedding dimensions: ${embedding.length}`
                );


                // ======================================
                // Store in Chroma
                // ======================================

                await this.chroma.addDocument(

                    randomUUID(),

                    embedding,

                    chunk,

                    {
                        userId: userId,

                        fileName: fileName,

                        chunk: i + 1,

                        uploadedAt:
                            new Date().toISOString()
                    }

                );

                console.log(
                    `💾 Stored chunk ${i + 1}/${chunks.length}`
                );
            }


            // ==========================================
            // 5. Completed
            // ==========================================

            console.log(
                `✅ Document ingestion completed. ${chunks.length} chunks stored.`
            );


            return {

                success: true,

                fileName,

                userId,

                chunks: chunks.length

            };

        } catch (error) {

            console.error(
                "❌ Document ingestion failed:",
                error.message
            );

            return {

                success: false,

                fileName,

                userId,

                chunks: 0,

                error: error.message

            };
        }
    }
}