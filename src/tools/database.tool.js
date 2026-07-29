import Conversation from "../models/Conversation.js";

export default class DatabaseTool {

    getDefinition() {

        return {

            name: "conversation_count",

            description: "Get total stored conversations.",

            parameters: {

                type: "OBJECT",

                properties: {}

            }

        };

    }

    async execute() {

        const total =
            await Conversation.countDocuments();

        return {

            totalConversations: total

        };

    }

}