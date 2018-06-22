import express = require("express");
import bodyParser = require("body-parser");

import { Blockchain } from "../blockchain";
import { request } from "http";

const HTTP_PORT: string = process.env.HTTP_PORT || "3001";

const app = express();
const blockchain: Blockchain = new Blockchain();

app.use(bodyParser.json());

app.get("/blocks", (request, response) => {
    response.json(blockchain.chain);
});

app.post("/mine", (request, response) => {
    const block = blockchain.addBlock(request.body.data)
    console.log("New block added: " + block.toString());

    //show updated chain with new block
    response.redirect("/blocks");
});

app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
})
