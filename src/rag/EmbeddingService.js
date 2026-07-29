import ai from "../services/openai.service.js";
import { EMBEDDING_MODEL } from "../config/constants.js";

export default class EmbeddingService {

    constructor() {
        this.ai = ai;
    }

    async create(text) {

        const response = await this.ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: text
        });

        return response.embeddings[0].values;

    }

}