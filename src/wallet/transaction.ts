import * as config from "../config";
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

    /**
     * Helper function used to generate new and reward transactions.
     */
    static transactionsWithOutput(senderWallet:Wallet, txOutputs:TransactionOutput []):Transaction {
        const transaction: Transaction = new this();
        transaction.txOutputs.push(...txOutputs);

        Transaction.signTransaction(transaction, senderWallet);
        return transaction;
    }

    /**
     * Creates a new transaction by setting TransactionOutput objects. 
     * @param senderWallet Sender's wallet.
     * @param recipient Recipient's wallet address (public key)
     * @param amountToSend Amount to send to recpient. If this is too high (exceeds wallet balance), throws an error.
     */
    static newTransaction(senderWallet: Wallet, recipient: string, amountToSend: number):Transaction {
        if(amountToSend > senderWallet.balance) {
            throw new RangeError("Amount " + amountToSend + " exceeds balance.");
        }

        let txOutputs: TransactionOutput [] = [
            { amount: senderWallet.balance - amountToSend, address: senderWallet.publicKey },
            { amount: amountToSend,                        address: recipient              }
        ];

        return Transaction.transactionsWithOutput(senderWallet, txOutputs);
    }

    /**
     * Generates reward transaction for miners. Added to array TransactionOutputs within the transaction.
     * @param minerWallet Miner's wallet.
     * @param blockchainWallet Blockchain's wallet.
     * @returns The reward transaction for the miner.
     */
    static newRewardTransaction(minerWallet:Wallet, blockchainWallet:Wallet): Transaction {
        let txOutputs: TransactionOutput [] = [
            { amount: 9999999,              address: config.BLOCKCHAIN_WALLET_ADDRESS},
            { amount: config.MINING_REWARD, address: minerWallet.publicKey}
        ];
        return Transaction.transactionsWithOutput(blockchainWallet, txOutputs);
    }

    /**
     * Used by sender - signs transaction and generates a TransactionInput object.
     * The signature is based on the hash of the TransactionOutput array.
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

    /**
     * Used by receiver - verifies transaction.
     * @param transaction Transaction to verify, based on its signature, hash and TransactionOutput objects.
     */
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
     * @param amountToTx Amount to transfer to new recipient. Throws an error if it exceeds balance.
     * @returns The updated transaction.
     */
    update(senderWallet: Wallet, recipient: string, amountToTx: number): Transaction {
        //find the TransactionOutput we need to update
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