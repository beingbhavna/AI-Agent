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
        console.log("👤 User:", userId);

        // 1. Extract PDF text
        const text = await this.loader.load(filePath);

        console.log(`📖 Extracted ${text.length} characters`);

        // 2. Split text
        const chunks = this.splitter.split(text);

        console.log(`✂️ Created ${chunks.length} chunks`);

        // 3. Create embeddings and store in Chroma
        for (let i = 0; i < chunks.length; i++) {

            const chunk = chunks[i];

            console.log(
                `🧠 Creating embedding ${i + 1}/${chunks.length}`
            );

            const embedding = await this.embedder.create(chunk);

            await this.chroma.addDocument(
                randomUUID(),
                embedding,
                chunk,
                {
                    userId,
                    fileName,
                    chunkIndex: i,
                    uploadedAt: new Date().toISOString()
                }
            );

            console.log(
                `💾 Stored chunk ${i + 1}/${chunks.length}`
            );
        }

        console.log(
            `✅ Document ingestion completed. ${chunks.length} chunks stored.`
        );

        return {
            success: true,
            fileName,
            userId,
            chunks: chunks.length
        };
    }
}