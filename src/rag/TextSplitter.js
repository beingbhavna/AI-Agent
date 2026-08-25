import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
export default class TextSplitter {
    constructor() {

        this.splitter =
            new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
                separators: [
                    "\n\n",
                    "\n",
                    ". ",
                    " ",
                    ""
                ]
            });

    }

    async split(text) {

        return await this.splitter.splitText(text);

    }

    // split(text, chunkSize = 1000, overlap = 200) {

    //     const chunks = [];

    //     let start = 0;

    //     while (start < text.length) {

    //         const end = start + chunkSize;

    //         chunks.push(
    //             text.slice(start, end)
    //         );

    //         start += chunkSize - overlap;

    //     }

    //     return chunks;

    // }

}