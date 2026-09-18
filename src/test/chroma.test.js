import ChromaService from "../vectorstore/ChromaService.js";
const chroma = new ChromaService();
await chroma.init();
const result = await chroma.collection.get({
    include: ["documents", "metadatas"]
});

console.log("========== CHROMA DATA ==========");
console.log("Total documents:", result.ids.length);
console.log(JSON.stringify(result, null, 2));