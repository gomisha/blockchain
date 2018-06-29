import * as WebSocket from "ws";
import Blockchain from "../blockchain";
import Block from "../blockchain/block";
import Transaction from "../wallet/transaction";
import TransactionPool from "../wallet/transaction-pool";

const P2P_PORT: string = process.env.P2P_PORT || "5001";

//list of peers will be comma separated with the following format:
//ws://localhost:5001,ws://localhost:5002,ws://localhost:5003
const peers: string[] = process.env.PEERS ? process.env.PEERS.split(",") : [];

//need to differentiate between message types for messageHandler()
const MESSAGE_TYPES = {
    chain: "CHAIN",
    transaction: "TRANSACTION"
};

export default class P2pServer {
    blockchain: Blockchain;
    tp: TransactionPool;
    webSockets: WebSocket[] = [];
    readonly server: WebSocket.Server;

    constructor(blockchain: Blockchain, tp: TransactionPool) {
        this.blockchain = blockchain;
        this.tp = tp;
        this.server = new WebSocket.Server({
            port: +P2P_PORT
        });
    }

    listen(): void {
        this.server.on("connection", webSocket => this.connectSocket(webSocket));
        this.connectToPeers();

        console.log("listening for P2P connections on " + P2P_PORT);
    }

    connectToPeers(): void {
        peers.forEach(peerURL => {
            //each peer address will be in format: ws://localhost:5001
            const webSocket: WebSocket = new WebSocket(peerURL);
            webSocket.on("open", () => {
                this.connectSocket(webSocket);
            })
        });
    }

    connectSocket(webSocket: WebSocket): void {
        this.webSockets.push(webSocket);
        console.log("socket connected");

        this.messageHandler(webSocket);
        this.sendChain(webSocket);
    }

    /**
     * Process incoming message, based on the message type.
     * @param socket Socket of incoming message.
     */
    messageHandler(socket: WebSocket): void {
        socket.on("message", message => {
            const messageData = JSON.parse(message.toString());

            switch(messageData.type) {
                case MESSAGE_TYPES.chain:
                    this.blockchain.replaceChain(messageData.chain);
                    break;
                case MESSAGE_TYPES.transaction:
                    this.tp.updateOrAddTransaction(messageData.transaction);
                    break;
                default:
                    throw new Error("Undefined or improper message type.");
            }
        });
    }

    /**
     * Convenience method for sending blockchain on a socket.
     * @param webSocket The WebScoket to send the blockchain on.
     */
    sendChain(webSocket: WebSocket): void {
        webSocket.send(JSON.stringify({ 
            type:MESSAGE_TYPES.chain, 
            chain: this.blockchain 
        }));
    }

    /**
     * Convenience method for sending transactions on a socket.
     * @param webSocket The websocket to send transaction on.
     * @param transaction The transaction to send.
     */
    sendTransaction(webSocket: WebSocket, transaction: Transaction): void {
        webSocket.send(JSON.stringify({
            type:MESSAGE_TYPES.transaction,
            transaction
        }));
    }

    /**
     * Send current blockchain to every other node so they can synchronize with it.
     */
    syncChain(): void {
        this.webSockets.forEach(webSocket => {
            this.sendChain(webSocket);
        })
    }

    /**
     * Inform other nodes when there's a new transaction.
     */
    broadcastTx(transaction: Transaction): void {
        this.webSockets.forEach(webSocket => {
            this.sendTransaction(webSocket, transaction);
        })
    }
}