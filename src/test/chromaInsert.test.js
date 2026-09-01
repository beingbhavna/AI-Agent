import "dotenv/config";
import ai from "../services/openai.service.js";
import { randomUUID } from "crypto";
import ChromaService from "../vectorstore/ChromaService.js";

const chroma = new ChromaService();

try {

    console.log("🚀 Starting Chroma Insert Test...");

    // ==========================================
    // 1. Initialize Chroma
    // ==========================================

    await chroma.init();

    console.log("✅ Chroma initialized");


    // ==========================================
    // 2. Create embedding
    // ==========================================

    console.log("🧠 Creating embedding...");

    const response = await ai.models.embedContent({

        model: "gemini-embedding-001",

        contents:
            "Angular Dependency Injection is awesome."

    });

    const embedding =
        response.embeddings[0].values;

    console.log(
        "✅ Embedding created"
    );

    console.log(
        "📏 Embedding dimensions:",
        embedding.length
    );


    // ==========================================
    // 3. Insert document
    // ==========================================

    const id = randomUUID();

    await chroma.addDocument(

        id,

        embedding,

        "Angular Dependency Injection is awesome.",

        {
            userId: "bhavna",
            fileName: "test-document.pdf",
            chunk: 1,
            uploadedAt:
                new Date().toISOString()
        }

    );

    console.log(
        "✅ Document stored successfully"
    );


    // ==========================================
    // 4. Check collection count
    // ==========================================

    const count =
        await chroma.count();

    console.log(
        "📊 Total documents in Chroma:",
        count
    );


    // ==========================================
    // 5. Get all documents
    // ==========================================

    const all =
        await chroma.getAll();

    console.log(
        "📦 Stored documents:"
    );

    console.log(
        JSON.stringify(
            all,
            null,
            2
        )
    );


} catch (error) {

    console.error(
        "❌ Chroma Insert Test Failed:"
    );

    console.error(
        error
    );
}