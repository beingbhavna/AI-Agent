import ai from "../services/openai.service.js";
import { EMBEDDING_MODEL } from "../config/constants.js";

export default class EmbeddingService {

    async create(text) {

        const response = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: text
        });

        return response.embeddings[0].values;
    }

}