import webSocket = require("ws");
import { Blockchain } from "../blockchain";
import { Socket } from "dgram";
import { Server } from "../../node_modules/@types/connect";

const P2P_PORT: string = process.env.P2P_PORT || "5001";

//list of peers will be comma separated with the following format:
//ws://localhost:5001,ws://localhost:5002,ws://localhost:5003
const peers : string [] = process.env.PEERS ? process.env.PEERS.split(",") : [];

class P2pServer {
    blockchain: Blockchain;
    sockets: Socket [];
    readonly server: Server;

    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;
        this.server = webSocket.Server({
            port: P2P_PORT
        });
    }

    listen(): void {
        this.server.on("connection", socket => this.connectSocket(socket));
        console.log("listening for P2P connections on " + P2P_PORT);

    }

    connectSocket(socket): void {
        this.sockets.push(socket);
        console.log("socket connected");
    }
}