import "dotenv/config";

import DocumentSearchTool
    from "../tools/DocumentSearchTool.js";

const tool =
    new DocumentSearchTool();

await tool.init();

const result =
    await tool.execute(
        {
            query: "VSS Enterprises services"
        },
        "bhavna"
    );

console.log(
    "\n========== DOCUMENT SEARCH RESULT ==========\n"
);

console.log(
    JSON.stringify(
        result,
        null,
        2
    )
);