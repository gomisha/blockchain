import * as express from "express";
import * as bodyParser from "body-parser";

import { Blockchain } from "../blockchain";
import { P2pServer } from "./p2p-server";

const HTTP_PORT: string = process.env.HTTP_PORT || "3001";

const app = express();
const blockchain: Blockchain = new Blockchain();
const p2pServer: P2pServer = new P2pServer(blockchain);

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

p2pServer.listen();