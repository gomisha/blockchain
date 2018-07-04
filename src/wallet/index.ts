import * as config from "../config";
import ChainUtil from "../chain-util";
import TransactionPool from "./transaction-pool";
import Transaction from "./transaction";
import Blockchain from "../blockchain";
import Block from "../blockchain/block";
import TransactionOutput from "./transaction-output";

export default class Wallet {
    balance: number;
    keypair: any;
    publicKey: any;
    address: string;
    static bcWallet: Wallet;
    
    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keypair = ChainUtil.genKeyPair();
        this.publicKey = this.keypair.getPublic().encode("hex");
    }

    /**
     * Uses Singleton pattern to retrieve the special Blockchain Wallet.
     * Creates it only one time.
     */
    static getBlockchainWallet():Wallet {
        if(!Wallet.bcWallet) {
            Wallet.bcWallet = new this();
            Wallet.bcWallet.address = config.BLOCKCHAIN_WALLET_ADDRESS;
        }
        return Wallet.bcWallet;
    }

    /**
     * Calculates wallet balance by examining the TransactionInput and TransactionOutput objects on the blockchain.
     * Only the most recent TransactionInput object is considered as the starting balance and then all other transfers
     * to this wallet since that timestamp are added to get the final wallet balance.
     * @param blockchain Blockchain to use for calculating the wallet balance.
     */
    calculateBalance(blockchain: Blockchain): number {
        let balance = this.balance;
        const allTransactions: Transaction [] = [];

        //collect all transactions into one list
        blockchain.chain.forEach(block => {
            let blockTransactions = <Transaction []> block.data;
            blockTransactions.forEach(transaction => {
                allTransactions.push(transaction);
            });
        });

        //find all the transactions who's input transactions are from this wallet
        const thisWalletTxs = allTransactions.filter(transaction => 
            transaction.txInput.address === this.publicKey);
        
        let startTime: number = 0;

        if(thisWalletTxs.length > 0) {
            //only interested in latest input transaction - balance will be calculated from it
            //get the most recent input transaction based on timestamp
            let mostRecentTx: Transaction = thisWalletTxs.reduce((previousTx, currentTx) => 
                (previousTx.txInput.timestamp > currentTx.txInput.timestamp) ? previousTx : currentTx);

            //find this wallet's OutputTransaction in the most recent Transaction
            //this will be the starting balance calculation
            let txOutput = <TransactionOutput> mostRecentTx.txOutputs.find(txOutput => 
                txOutput.address === this.publicKey);
            balance = txOutput.amount;

            //calculate balance based on output transactions after the timestamp of input transaction
            startTime = mostRecentTx.txInput.timestamp;
        }

        //add all transfers to this wallet from other senders after this wallet's latest transaction
        for(let i=0; i<allTransactions.length; i++) {
            if(allTransactions[i].txInput.timestamp > startTime &&
               allTransactions[i].txInput.address !== this.publicKey //from other senders
            ) {

                for(let j=0; j<allTransactions[i].txOutputs.length; j++) {
                    if(allTransactions[i].txOutputs[j].address === this.publicKey) {
                        balance += allTransactions[i].txOutputs[j].amount;
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