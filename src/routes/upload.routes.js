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
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "PDF file is required"
            });
        }
        const userId = req.body.userId || "bhavna";

        console.log("📄 Upload started");
        console.log("📁 File:", req.file.originalname);
        console.log("👤 User:", userId);
        // Read PDF
        const text = await loader.load(req.file.path);

        // Split into chunks
        const chunks = splitter.split(text);
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await embedder.create(chunk);
            await chroma.addDocument(
                randomUUID(),
                embedding,
                chunk,
                {
                    userId: req.body.userId || "bhavna",
                    fileName: req.file.originalname,
                    chunk: i + 1,
                    uploadedAt: new Date().toISOString()
                }
            );
            console.log(`Inserted Chunk ${i + 1}`);
        }
        res.json({
            success: true,
            chunks: chunks.length,
            message: "PDF Indexed Successfully"
        });
    } catch (error) {
        console.error("❌ PDF Upload Failed:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;