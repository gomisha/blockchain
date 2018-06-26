import ChainUtil from "../chain-util";
import Wallet from ".";
import TransactionItem from "./transaction-item";

export default class Transaction {
    id: string;
    inputItem: TransactionItem;
    outputItems: TransactionItem[];

    constructor() {
        this.id = ChainUtil.genID();
        this.outputItems = [];
    }

    static newTransaction(senderWallet: Wallet, recipient: string, amount: number):Transaction {
        const transaction: Transaction = new this();
        if(amount > senderWallet.balance) {
            throw new RangeError("Amount " + amount + " exceeds balance.");
        }
        transaction.outputItems.push(...[
            { amount: senderWallet.balance - amount, address: senderWallet.publicKey, timestamp: Date.now(), signature: "" },
            { amount,                                address: recipient,              timestamp: Date.now(), signature: "" }
        ]);

        Transaction.signTransaction(transaction, senderWallet);

        return transaction;
    }

    /**
     * Signs transaction.
     * @param transaction Transaction to sign. Only the outputItems will be signed.
     * @param senderWallet Wallet to use for signing.
     */
    static signTransaction(transaction: Transaction, senderWallet: Wallet): void {
        transaction.inputItem = {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(ChainUtil.genHash(transaction.outputItems))
        };
    }

    static verifyTransaction(transaction: Transaction): boolean {
        return ChainUtil.verifySignature(
            transaction.inputItem.address, 
            transaction.inputItem.signature, 
            ChainUtil.genHash(transaction.outputItems)
        );
    }
}