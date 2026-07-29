class RagService {

    async search(question){

        const embedding =
            await embedder.create(question);

        const result =
            await chroma.search(embedding);

        return result.documents[0];

    }

}