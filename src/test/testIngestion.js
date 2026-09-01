import "dotenv/config";
import DocumentIngestionService from "../rag/DocumentIngestionService.js";

const ingestion = new DocumentIngestionService();

const filePath = "D:/AI-agent/AI-Agent/documents/VSS_Enterprises_Brochure.pdf";

const fileName = "VSS_Enterprises_Brochure.pdf";

const userId = "bhavna";

try {
    const result = await ingestion.ingest(
            filePath,
            fileName,
            userId
        );

    console.log("📦 INGESTION RESULT:");
    console.log(JSON.stringify(result,null,2));
} catch (error) {
    console.error(
        "❌ Test ingestion failed:"
    );

    console.error(
        error
    );
}