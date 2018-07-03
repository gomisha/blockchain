import * as config from "../config";
import ChainUtil from "../chain-util";
import TransactionPool from "./transaction-pool";
import Transaction from "./transaction";
import Blockchain from "../blockchain";
import TransactionOutput from "./transaction-output";

export default class Wallet {
    balance: number;
    keypair: any;
    publicKey: any;
    address: string;
    
    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keypair = ChainUtil.genKeyPair();
        this.publicKey = this.keypair.getPublic().encode("hex");
    }

    static blockchainWallet():Wallet {
        const blockchainWallet:Wallet = new this();

        blockchainWallet.address = config.BLOCKCHAIN_WALLET_ADDRESS;
        return blockchainWallet;
    }

    calculateBalance(blockchain: Blockchain): number {
        let balance = this.balance;
        const transactions: Transaction [] = [];
        blockchain.chain.forEach(block => block.transactions.forEach(transaction => {
            transactions.push(transaction);
        }));

        //find all the input transactions of this wallet
        const matchingWalletTxs = transactions.filter(transaction => 
            transaction.txInput.address === this.publicKey);
        
        let startTime: number = 0;

        if(matchingWalletTxs.length > 0) {
            //only interested in latest input transaction - balance will be calculated from it
            //get the most recent input transaction based on timestamp
            let mostRecentTx: Transaction = matchingWalletTxs.reduce((previousTx, currentTx) => 
                (previousTx.txInput.timestamp > currentTx.txInput.timestamp) ? previousTx : currentTx );

            //find this wallet's OutputTransaction in the most recent Transaction
            //this will be the starting balance calculation
            let txOutput = <TransactionOutput> mostRecentTx.txOutputs.find(txOutput => 
                txOutput.address === this.publicKey);
            balance = txOutput.amount;

            //calculate balance based on output transactions after the timestamp of input transaction
            startTime = mostRecentTx.txInput.timestamp;
        }

        for(let i=0; i<transactions.length; i++) {
            if(transactions[i].txInput.timestamp > startTime) {
                for(let j=0; j<transactions[i].txOutputs.length; j++) {
                    if(transactions[i].txOutputs[j].address === this.publicKey) {
                        balance += transactions[i].txOutputs[j].amount;
                    }
                }
            }
        }
        return balance;
    }

    /**
     * Updates existing transaction if it exists or adds a new transaction to TransactionPool
     * @param recipient Recipient of the transaction.
     * @param sendAmount Amount sent in transaction.
     * @param tp Transaction Pool where to update / create new transaction.
     * @returns The transaction that was created or updated.
     */
    createOrUpdateTransaction(recipient: string, sendAmount: number, blockchain: Blockchain, tp: TransactionPool): Transaction {
        this.balance = this.calculateBalance(blockchain);

        if(sendAmount > this.balance) {
            throw new RangeError("Amount " + sendAmount + " exceeds current balance: " + this.balance);
        }

        //check if transaction exists
        let foundTx: Transaction = tp.findTransaction(this.publicKey);

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