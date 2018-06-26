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

    /**
     * Signs the hash representation of some data.
     * @param dataHash The hashed data.
     */
    sign(dataHash: string): string {
        return this.keypair.sign(dataHash);
    }

    toString(): string {
        return `Wallet -
            publicKey: ${this.publicKey.toString()}
            balance  : ${this.balance}
        `;
    }
}