export default class SQLGuard {

    static validate(query) {

        if (!query || typeof query !== "string") {
            return {
                allowed: false,
                reason: "SQL query is empty or invalid."
            };
        }

        const sql = query
            .trim()
            .replace(/\s+/g, " ");

        const upperSQL = sql.toUpperCase();

        // ==========================================
        // 1. Only SELECT queries are allowed
        // ==========================================

        if (!upperSQL.startsWith("SELECT")) {
            return {
                allowed: false,
                reason: "Only SELECT queries are allowed."
            };
        }

        // ==========================================
        // 2. Block dangerous SQL keywords
        // ==========================================

        const forbiddenKeywords = [
            "INSERT",
            "UPDATE",
            "DELETE",
            "DROP",
            "ALTER",
            "TRUNCATE",
            "CREATE",
            "REPLACE",
            "GRANT",
            "REVOKE",
            "EXEC",
            "EXECUTE"
        ];

        for (const keyword of forbiddenKeywords) {

            const regex = new RegExp(
                `\\b${keyword}\\b`,
                "i"
            );

            if (regex.test(sql)) {

                return {
                    allowed: false,
                    reason: `SQL keyword '${keyword}' is not allowed.`
                };
            }
        }

        // ==========================================
        // 3. Block sensitive columns
        // ==========================================

        const sensitiveColumns = [
            "password",
            "token",
            "secret",
            "api_key",
            "apikey",
            "access_token",
            "refresh_token"
        ];

        for (const column of sensitiveColumns) {

            const regex = new RegExp(
                `\\b${column}\\b`,
                "i"
            );

            if (regex.test(sql)) {

                return {
                    allowed: false,
                    reason:
                        `Access to sensitive column '${column}' is not allowed.`
                };
            }
        }

        // ==========================================
        // 4. Block multiple SQL statements
        // ==========================================

        const statements = sql
            .split(";")
            .map(item => item.trim())
            .filter(Boolean);

        if (statements.length > 1) {

            return {
                allowed: false,
                reason: "Multiple SQL statements are not allowed."
            };
        }

        // ==========================================
        // 5. Block SQL comments
        // ==========================================

        if (
            sql.includes("--") ||
            sql.includes("/*") ||
            sql.includes("*/")
        ) {

            return {
                allowed: false,
                reason: "SQL comments are not allowed."
            };
        }

        // ==========================================
        // 6. Query is safe
        // ==========================================

        return {
            allowed: true,
            query: sql
        };
    }
}