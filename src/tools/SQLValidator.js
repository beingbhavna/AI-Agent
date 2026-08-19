export default class SQLValidator {

    constructor() {

        // Tables the AI is allowed to access
        this.allowedTables = [
            "messages",
            "users"
        ];

        // Sensitive columns that must NEVER be exposed
        this.blockedColumns = [
            "password"
        ];

        // Dangerous SQL operations
        this.blockedKeywords = [
            "insert",
            "update",
            "delete",
            "drop",
            "truncate",
            "alter",
            "create",
            "grant",
            "revoke",
            "replace",
            "exec",
            "execute"
        ];
    }


    validate(sql) {

        if (!sql || typeof sql !== "string") {

            throw new Error(
                "SQL query is required."
            );
        }


        const query = sql
            .trim()
            .toLowerCase();


        // ==========================================
        // 1. Only SELECT
        // ==========================================

        if (!query.startsWith("select")) {

            throw new Error(
                "Only SELECT queries are allowed."
            );
        }


        // ==========================================
        // 2. Block dangerous keywords
        // ==========================================

        for (const keyword of this.blockedKeywords) {

            const regex =
                new RegExp(`\\b${keyword}\\b`, "i");

            if (regex.test(query)) {

                throw new Error(
                    `Blocked SQL keyword: ${keyword}`
                );
            }
        }


        // ==========================================
        // 3. Block sensitive columns
        // ==========================================

        for (const column of this.blockedColumns) {

            const regex =
                new RegExp(`\\b${column}\\b`, "i");

            if (regex.test(query)) {

                throw new Error(
                    `Access to sensitive column '${column}' is not allowed.`
                );
            }
        }


        // ==========================================
        // 4. Check table names
        // ==========================================

        const tableMatches =
            query.match(/\bfrom\s+([a-zA-Z0-9_]+)/i);

        if (tableMatches) {

            const tableName =
                tableMatches[1].toLowerCase();

            if (!this.allowedTables.includes(tableName)) {

                throw new Error(
                    `Access to table '${tableName}' is not allowed.`
                );
            }
        }


        // ==========================================
        // 5. Block multiple statements
        // ==========================================

        const statements =
            query
                .split(";")
                .map(x => x.trim())
                .filter(Boolean);

        if (statements.length > 1) {

            throw new Error(
                "Multiple SQL statements are not allowed."
            );
        }


        // ==========================================
        // 6. Basic LIMIT protection
        // ==========================================

        if (
            !query.includes("limit") &&
            !query.includes("count(")
        ) {

            // Automatically require a LIMIT
            throw new Error(
                "SELECT queries must contain LIMIT or use COUNT()."
            );
        }


        return true;
    }
}