import * as config from "../config";
import ChainUtil from "../chain-util";
import TransactionPool from "./transaction-pool";
import Transaction from "./transaction";

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
     * Updates existing transaction if it exists or adds a new transaction to TransactionPool
     * @param recipient Recipient of the transaction.
     * @param sendAmount Amount sent in transaction.
     * @param tp Transaction Pool where to update / create new transaction.
     * @returns The transaction that was created or updated.
     */
    createOrUpdateTransaction(recipient: string, sendAmount: number, tp: TransactionPool): Transaction {
        if(sendAmount > this.balance) {
            throw new RangeError("Amount " + sendAmount + " exceeds current balance: " + this.balance);
        }

        //check if transaction exists
        let foundTx: Transaction = tp.existingTransaction(this.publicKey);

        if(foundTx) {
            foundTx.update(this, recipient, sendAmount);
        }
        else {
            foundTx = Transaction.newTransaction(this, recipient, sendAmount);
            tp.updateOrAddTransaction(foundTx);
        }
        return foundTx;
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