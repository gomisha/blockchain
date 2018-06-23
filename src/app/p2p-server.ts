import * as WebSocket from "ws";
import { Blockchain } from "../blockchain";

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
            webSocket.on("open", () =>{
                this.connectSocket(webSocket);
            })
        });
    }

    connectSocket(socket: WebSocket): void {
        this.webSockets.push(socket);
        console.log("socket connected");

        this.messageHandler(socket);
        socket.send(JSON.stringify(this.blockchain.chain));
    }

    messageHandler(socket: WebSocket): void {
        socket.on("message", message => {
            const data = JSON.parse(message.toString());
            console.log("data", data);
        });
    }
}