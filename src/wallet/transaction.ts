import ChainUtil from "../chain-util";
import Wallet from ".";
import Output from "./output";

export default class Transaction {
    id: string;
    input: string;
    outputs: Output[];

    constructor() {
        this.id = ChainUtil.genID();
        this.input = "";
        this.outputs = [];
    }

    static newTransaction(senderWallet: Wallet, recipient: string, amount: number):Transaction {
        const transaction: Transaction = new this();
        if(amount > senderWallet.balance) {
            throw new RangeError("Amount " + amount + " exceeds balance.");
        }
        transaction.outputs.push(...[
            { amount: senderWallet.balance - amount, address: senderWallet.publicKey },
            { amount,                                address: recipient }
        ]);

        return transaction;
    }
}