import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export default class PdfLoader {

    async load(filePath) {

        const loader = new PDFLoader(filePath);

        const docs = await loader.load();

        let text = "";

        docs.forEach(doc => {
            text += doc.pageContent + "\n";
        });

        return text;
    }

}