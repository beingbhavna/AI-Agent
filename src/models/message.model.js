import db from "../config/db.js";

export const saveMessage = async (userId, role, message) => {
    await db.query(
        "INSERT INTO messages(user_id, role, message) VALUES(?,?,?)",
        [userId, role, message]
    );
};

export const getMessages = async (userId) => {
    const [rows] = await db.query(
        "SELECT role, message FROM messages WHERE user_id=? ORDER BY id ASC",
        [userId]
    );

    return rows;
};