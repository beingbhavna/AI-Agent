export default class RAGContextBuilder {

    build(searchResults) {

        if (
            !Array.isArray(searchResults) ||
            searchResults.length === 0
        ) {

            return {
                context: "",
                sources: []
            };
        }


        const contextParts = [];
        const sources = [];


        for (const result of searchResults) {

            if (!result?.text) {
                continue;
            }


            const metadata =
                result.metadata || {};


            const fileName =
                metadata.fileName ||
                "Unknown Document";


            const chunk =
                metadata.chunkIndex ??
                metadata.chunk ??
                "Unknown";


            contextParts.push(
                `Source: ${fileName}
Chunk: ${chunk}

${result.text}`
            );


            sources.push({

                fileName,

                chunk,

                distance:
                    result.distance ?? null
            });
        }


        return {

            context:
                contextParts.join(
                    "\n\n----------------------------------------\n\n"
                ),

            sources
        };
    }
}