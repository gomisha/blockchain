import * as WebSocket from "ws";
import { Blockchain } from "../blockchain";
import { Block } from "../blockchain/block";

const P2P_PORT: string = process.env.P2P_PORT || "5001";

//list of peers will be comma separated with the following format:
//ws://localhost:5001,ws://localhost:5002,ws://localhost:5003
const peers : string [] = process.env.PEERS ? process.env.PEERS.split(",") : [];

export class P2pServer {
    blockchain: Blockchain;
    webSockets: WebSocket [] = [];
    readonly server: WebSocket.Server;

    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;

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

    messageHandler(socket: WebSocket): void {
        socket.on("message", message => {
            console.log("messageHander>message.toString()=" + message.toString());
            const blockchain = new Blockchain();
            blockchain.chain = <Block []> JSON.parse(message.toString());
            console.log("data", blockchain);

            this.blockchain.replaceChain(blockchain);
        });
    }

    /**
     * Convenience method for sending blockchain on a socket.
     * @param webSocket The WebScoket to send the blockchain is on.
     */
    sendChain(webSocket: WebSocket): void {
        webSocket.send(JSON.stringify(this.blockchain.chain));
    }

    /**
     * Send current blockchain to every other node so they can synchronize with it.
     */
    syncChain(): void {
        this.webSockets.forEach(webSocket =>{
            this.sendChain(webSocket);
        })
    }
}