import mysql from "mysql2/promise";
import SQLValidator from "./SQLValidator.js";

export default class SQLTool {

    constructor() {
        this.connection = null;
        this.validator = new SQLValidator();
    }

    getDefinition() {
        return {
            name: "sql",
            description: "Execute SELECT SQL queries on MySQL database."
        };
    }

    async connect() {

        if (this.connection) {
            return;
        }

        this.connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("✅ MySQL Connected");
    }

    validateQuery(sql) {

        const query = sql.trim().toLowerCase();

        // Allow only SELECT queries
        if (!query.startsWith("select")) {
            throw new Error("Only SELECT queries are allowed.");
        }

        // Block dangerous keywords
        const blocked = [
            "drop",
            "delete",
            "truncate",
            "update",
            "insert",
            "alter",
            "create",
            "grant",
            "revoke"
        ];

        for (const keyword of blocked) {

            if (query.includes(keyword)) {
                throw new Error(`Blocked SQL keyword: ${keyword}`);
            }

        }
        return this.validator.validate(sql);
    }

    async execute(sql) {

        try {

            await this.connect();

            this.validateQuery(sql);

            const [rows] = await this.connection.execute(sql);

            return {
                success: true,
                count: rows.length,
                rows
            };

        } catch (error) {

            return {
                success: false,
                error: error.message
            };

        }

    }

}