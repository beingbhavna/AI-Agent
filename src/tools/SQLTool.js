import mysql from "mysql2/promise";
import SQLValidator from "./SQLValidator.js";

export default class SQLTool {

    constructor() {
        this.connection = null;
        this.validator = new SQLValidator();

        // Sensitive columns that AI must never access
        this.sensitiveColumns = [
            "password",
            "password_hash",
            "token",
            "access_token",
            "refresh_token",
            "secret",
            "api_key",
            "apikey"
        ];
    }

    getDefinition() {
        return {
            name: "sql",
            description:
                "Execute safe SELECT SQL queries on the MySQL database. " +
                "Sensitive columns and dangerous SQL operations are blocked."
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

        if (!sql || typeof sql !== "string") {
            throw new Error("SQL query must be a valid string.");
        }

        const query = sql.trim().toLowerCase();

        // ==========================================
        // 1. Only SELECT is allowed
        // ==========================================

        if (!query.startsWith("select")) {
            throw new Error("Only SELECT queries are allowed.");
        }

        // ==========================================
        // 2. Block multiple statements
        // ==========================================

        const statements = query
            .split(";")
            .map(x => x.trim())
            .filter(Boolean);

        if (statements.length > 1) {
            throw new Error("Multiple SQL statements are not allowed.");
        }

        // ==========================================
        // 3. Block dangerous SQL keywords
        // ==========================================

        const blockedKeywords = [
            "drop",
            "delete",
            "truncate",
            "update",
            "insert",
            "alter",
            "create",
            "grant",
            "revoke",
            "replace",
            "rename",
            "call",
            "load_file",
            "outfile",
            "dumpfile"
        ];

        for (const keyword of blockedKeywords) {

            const regex = new RegExp(`\\b${keyword}\\b`, "i");

            if (regex.test(query)) {
                throw new Error(
                    `Blocked SQL keyword: ${keyword}`
                );
            }
        }

        // ==========================================
        // 4. Block sensitive columns
        // ==========================================

        for (const column of this.sensitiveColumns) {

            const regex = new RegExp(
                `\\b${column}\\b`,
                "i"
            );

            if (regex.test(query)) {
                throw new Error(
                    `Access to sensitive column '${column}' is not allowed.`
                );
            }
        }

        // ==========================================
        // 5. Existing SQL validator
        // ==========================================

        return this.validator.validate(sql);
    }

    async execute(sql) {

        try {

            await this.connect();

            this.validateQuery(sql);

            const [rows] =
                await this.connection.execute(sql);

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