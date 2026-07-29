import ai from "../services/openai.service.js";
import express from "express";
import multer from "multer";
import PdfLoader from "../rag/PdfLoader.js";
import TextSplitter from "../rag/TextSplitter.js";
import EmbeddingService from "../embeddings/EmbeddingService.js";
import ChromaService from "../vectorstore/ChromaService.js";
import { randomUUID } from "crypto";

const router = express.Router();
const loader = new PdfLoader();
const splitter = new TextSplitter();
const embedder = new EmbeddingService();
const chroma = new ChromaService();
await chroma.init();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

router.post("/upload", upload.single("pdf"), async (req, res) => {

    try {

        // Read PDF
        const text = await loader.load(req.file.path);

        // Split into chunks
        const chunks = splitter.split(text);
        for (const [index, chunk] of chunks.entries()) {
            const response = await ai.models.embedContent({
                model: "gemini-embedding-001",
                contents: chunk
            });
            const embedding = await embedder.create(chunk);
            await chroma.addDocument(
                randomUUID(),
                embedding,
                chunk,
                {
                    userId,
                    fileName: req.file.originalname,
                    chunk: index + 1
                }
            );
        }
        res.json({
            success: true,
            chunks: chunks.length,
            message: "PDF Indexed Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

export default router;