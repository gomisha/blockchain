import ChainUtil from "../chain-util";
import Wallet from ".";
import TransactionInput from "./transaction-input";
import TransactionOutput from "./transaction-output";

export default class Transaction {
    id: string;
    txInput: TransactionInput;
    txOutputs: TransactionOutput[];

    constructor() {
        this.id = ChainUtil.genID();
        this.txOutputs = [];
    }

    static newTransaction(senderWallet: Wallet, recipient: string, amount: number):Transaction {
        const transaction: Transaction = new this();
        if(amount > senderWallet.balance) {
            throw new RangeError("Amount " + amount + " exceeds balance.");
        }
        transaction.txOutputs.push(...[
            { amount: senderWallet.balance - amount, address: senderWallet.publicKey },
            { amount,                                address: recipient }
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
        transaction.txInput = {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(ChainUtil.genHash(transaction.txOutputs))
        };
    }

    static verifyTransaction(transaction: Transaction): boolean {
        return ChainUtil.verifySignature(
            transaction.txInput.address, 
            transaction.txInput.signature, 
            ChainUtil.genHash(transaction.txOutputs)
        );
    }

    /**
     * Allows sender to send funds to multiple recipients by updating the transaction with additional 
     * TransactionOutput objects.
     * @param senderWallet Wallet that will be updated.
     * @param recipient Address of additional recipient.
     * @param amountToTx Amount to transfer to recipient.
     */
    update(senderWallet: Wallet, recipient: string, amountToTx: number): Transaction {
        //find the output we need to update
        const senderTxOutput = <TransactionOutput> this.txOutputs.find(
            txOutput => txOutput.address === senderWallet.publicKey);

        if(amountToTx > senderTxOutput.amount) {
            throw new RangeError("Amount " + amountToTx + " exceeds balance.");
        }

        //reduce the sender's balance by the amount being transferred
        senderTxOutput.amount -= amountToTx;

        //add additional TransactionOutput object to list
        this.txOutputs.push({ amount: amountToTx, address: recipient});
        Transaction.signTransaction(this, senderWallet);
        return this;
    }
}