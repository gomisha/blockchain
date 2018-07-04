import * as express from "express";
import * as bodyParser from "body-parser";

import * as config from "../config";
import Blockchain from "../blockchain";
import Block from "../blockchain/block";
import P2pServer from "./p2p-server";
import Wallet from "../wallet";
import TransactionPool from "../wallet/transaction-pool";
import Miner from "./miner";

const HTTP_PORT: string = process.env.HTTP_PORT || "3001";

const app = express();
const blockchain: Blockchain = new Blockchain();
const wallet: Wallet = new Wallet();
const tp: TransactionPool = new TransactionPool();
const p2pServer: P2pServer = new P2pServer(blockchain, tp);
const miner = new Miner(blockchain, tp, wallet, p2pServer);

app.use(bodyParser.json());

//view balance
app.get(config.ENDPOINT_GET_BALANCE, (request, response) => {
    response.json({balance: wallet.calculateBalance(blockchain)});
});

//view all blocks on blockchain
app.get(config.ENDPOINT_GET_BLOCKS, (request, response) => {
    response.json({blockchain: blockchain.chain});
});

//show wallet's public key
app.get(config.ENDPOINT_GET_PUBLIC_KEY, (request, response) => {    
    response.json({publicKey: wallet.publicKey});
});

//view all transactions
app.get(config.ENDPOINT_GET_TRANSACTIONS, (request, response) => {
    response.json({transactions: tp.transactions});
});

//create a transaction with user's wallet and broadcast it to other nodes
app.post(config.ENDPOINT_POST_TRANSACTIONS, (request, response) => {
    let recipient: string = request.body.recipient;
    let amount:number = request.body.amount;
    let transaction = wallet.createOrUpdateTransaction(recipient, amount, blockchain, tp);
    p2pServer.broadcastTx(transaction);
    response.redirect(config.ENDPOINT_GET_TRANSACTIONS);
});

//mines new block with transaction data
app.get(config.ENDPOINT_GET_MINE_TRANSACTIONS, (request, response) => {
    const block: Block = miner.mine();
    console.log("New block added: " + block.toString());
    response.redirect(config.ENDPOINT_GET_BLOCKS);
});

//adds new block to blockchain - generic mine endpoint for mining any data
app.post(config.ENDPOINT_POST_MINE, (request, response) => {
    const block = blockchain.addBlock(request.body.data);
    console.log("New block added: " + block.toString());

    //update other nodes as soon as new block mined
    p2pServer.syncChains();

    //show updated chain with new block
    response.redirect(config.ENDPOINT_GET_BLOCKS);
});

app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
})

p2pServer.listen();