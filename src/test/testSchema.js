import DatabaseSchemaTool from "../tools/DatabaseSchemaTool.js";
import dotenv from "dotenv";

dotenv.config();

const tool = new DatabaseSchemaTool();

const result = await tool.execute();

console.log(JSON.stringify(result, null, 2));