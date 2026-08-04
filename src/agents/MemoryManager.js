import db from "../config/db.js";

export default class MemoryManager {

    async getConversation(userId) {
        try {
            console.log("Loading conversation for:", userId);
            const [rows] = await db.query(
                `SELECT role, message AS text
     FROM messages
     WHERE user_id = ?
     ORDER BY id ASC`,
                [userId]
            );

            return rows;

        } catch (error) {
            console.warn("Memory read failed:", error.message);
            return [];
        }
    }

    async addMessage(userId, role, text) {
        try {
            console.log("Saving message:", userId, role, text);

            await db.query(
                "INSERT INTO messages(user_id, role, message) VALUES(?,?,?)",
                [userId, role, text]
            );

            console.log("✅ Message Saved");

        } catch (error) {
            console.error("Memory write failed:", error);
        }
    }

    async clearConversation(userId) {
        try {

            await db.query(
                `DELETE FROM messages
                 WHERE user_id=?`,
                [userId]
            );

        } catch (error) {
            console.warn("Memory clear failed:", error.message);
        }
    }
}