import express = require("express");

import { Blockchain } from "../blockchain";

const HTTP_PORT: string = process.env.HTTP_PORT || "3001";

const app = express();
const blockchain: Blockchain = new Blockchain();

app.get("/blocks", (request, response) => {
    response.json(blockchain.chain);
});

app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
})
