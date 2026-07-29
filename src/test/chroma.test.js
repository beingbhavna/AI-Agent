import ChromaService from "../vectorstore/ChromaService.js";
const chroma = new ChromaService();
await chroma.init();
console.log("Connected Successfully");