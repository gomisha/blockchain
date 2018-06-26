import ChainUtil from "../chain-util";
import Wallet from ".";
import TransactionItem from "./transaction-item";

export default class Transaction {
    id: string;
    input: TransactionItem;
    outputs: TransactionItem[];

    constructor() {
        this.id = ChainUtil.genID();
        this.outputs = [];
    }

    static newTransaction(senderWallet: Wallet, recipient: string, amount: number):Transaction {
        const transaction: Transaction = new this();
        if(amount > senderWallet.balance) {
            throw new RangeError("Amount " + amount + " exceeds balance.");
        }
        transaction.outputs.push(...[
            { amount: senderWallet.balance - amount, address: senderWallet.publicKey, timestamp: Date.now() },
            { amount,                                address: recipient,              timestamp: Date.now() }
        ]);

        this.signTransaction(transaction, senderWallet);

        return transaction;
    }

    static signTransaction(transaction: Transaction, senderWallet: Wallet): void {
        transaction.input = {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey
        }
    }
}