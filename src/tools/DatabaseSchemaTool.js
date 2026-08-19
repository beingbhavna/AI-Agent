import mysql from "mysql2/promise";

export default class DatabaseSchemaTool {

    constructor() {
        this.connection = null;
    }

    getDefinition() {
        return {
            name: "database_schema",
            description:
                "Get the database schema including table names and columns. Use this before generating SQL when database structure is unknown."
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

        console.log("✅ Schema Tool Connected");
    }

    async execute() {

        try {

            await this.connect();

            const [tables] = await this.connection.execute(`
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
            `);

            const schema = [];

            for (const table of tables) {

                const tableName = table.TABLE_NAME;

                const [columns] = await this.connection.execute(
                    `
                    SELECT
                        COLUMN_NAME,
                        DATA_TYPE,
                        IS_NULLABLE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = ?
                    ORDER BY ORDINAL_POSITION
                    `,
                    [tableName]
                );

                schema.push({
                    table: tableName,
                    columns
                });
            }

            return {
                success: true,
                schema
            };

        } catch (error) {

            return {
                success: false,
                error: error.message
            };
        }
    }
}