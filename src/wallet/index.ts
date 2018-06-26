import * as config from "../config";
import ChainUtil from "../chain-util";

export default class Wallet {
    balance: number;
    keypair: any;
    publicKey: any;
    
    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keypair = ChainUtil.genKeyPair();
        this.publicKey = this.keypair.getPublic().encode("hex");
    }

    toString(): string {
        return `Wallet -
            publicKey: ${this.publicKey.toString()}
            balance  : ${this.balance}
        `;
    }
}