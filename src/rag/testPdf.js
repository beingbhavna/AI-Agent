import PdfLoader from "./src/rag/PdfLoader.js";

const loader = new PdfLoader();

const text = await loader.load("./uploads/sample.pdf");

console.log(text);