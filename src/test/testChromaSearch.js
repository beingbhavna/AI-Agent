import { ChromaClient } from "chromadb";
import EmbeddingService from "../embeddings/EmbeddingService.js";

const client = new ChromaClient({
    path: "http://localhost:8000"
});

const embeddingService = new EmbeddingService();

async function test() {

    console.log("🔎 Checking Chroma collection...");

    // =========================================
    // 1. Get collection
    // =========================================

    const collection = await client.getCollection({
        name: "documents"
    });

    console.log("✅ Collection found");


    // =========================================
    // 2. Check document count
    // =========================================

    const count = await collection.count();

    console.log(
        "📊 Total documents in Chroma:",
        count
    );


    // =========================================
    // 3. Read stored documents
    // =========================================

    const stored = await collection.get({
        include: [
            "documents",
            "metadatas"
        ]
    });

    console.log(
        "📦 Stored IDs:",
        stored.ids
    );

    console.log(
        "📄 Stored Metadata:",
        JSON.stringify(
            stored.metadatas,
            null,
            2
        )
    );

    console.log(
        "📝 Stored Documents:",
        JSON.stringify(
            stored.documents,
            null,
            2
        )
    );


    // =========================================
    // 4. Create query embedding
    // =========================================

    const query =
        "VSS Enterprises services";

    console.log(
        "🔎 Search Query:",
        query
    );

    const embedding =
        await embeddingService.create(query);

    console.log(
        "🧠 Embedding created"
    );


    // =========================================
    // 5. Search WITHOUT userId filter
    // =========================================

    const result =
        await collection.query({

            queryEmbeddings: [
                embedding
            ],

            nResults: 5,

            include: [
                "documents",
                "metadatas",
                "distances"
            ]

        });


    // =========================================
    // 6. Print search result
    // =========================================

    console.log(
        "📦 Chroma Search Result:"
    );

    console.log(
        JSON.stringify(
            result,
            null,
            2
        )
    );

}

test().catch(error => {

    console.error(
        "❌ Test failed:"
    );

    console.error(error);

});