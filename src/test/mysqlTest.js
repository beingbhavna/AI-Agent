import db from "../config/db.js";

try {
    const [rows] = await db.query("SELECT NOW() AS currentTime");

    console.log(rows);
} catch (err) {
    console.error(err);
}