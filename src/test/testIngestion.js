import "dotenv/config";
import DocumentIngestionService from "../rag/DocumentIngestionService.js";
const ingestion = new DocumentIngestionService();

const filePath = "D:/AI-agent/AI-Agent/documents/VSS_Enterprises_Brochure.pdf";

const result =
    await ingestion.ingest(
        filePath,
        "bhavna",
        "VSS_Enterprises_Brochure.pdf"
    );

console.log(
    "📦 INGESTION RESULT:",
    result
);