import * as config from "../config";
import ChainUtil from "../chain-util";
import TransactionPool from "./transaction-pool";
import Transaction from "./transaction";
import Blockchain from "../blockchain";
import Block from "../blockchain/block";

export default class Wallet {
    balance: number;
    keypair: any;
    publicKey: any;
    static bcWallet: Wallet;

    //for balance re-calculation - need to know from where to start recalculating
    lastBlockTimestamp: number;

    //when last did balance recalculation, this was the last block
    lastBlockBalanceCalc: number;

    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keypair = ChainUtil.genKeyPair();
        this.publicKey = this.keypair.getPublic().encode("hex");
        this.lastBlockTimestamp = 0;
        this.lastBlockBalanceCalc = 0;
    }

    /**
     * Uses Singleton pattern to retrieve the special Blockchain Wallet.
     * Creates it only one time.
     */
    static getBlockchainWallet():Wallet {
        if(!Wallet.bcWallet) {
            Wallet.bcWallet = new this();
            Wallet.bcWallet.publicKey = config.BLOCKCHAIN_WALLET_ADDRESS;
        }
        return Wallet.bcWallet;
    }

    /**
     * Calculates wallet balance by:
     * - only checking new blocks mined (added) since last time balance was calculated
     * - divides up transactions into those that transfered money TO this wallet and FROM this wallet
     * Sets the balance of this wallet after calculating it, so won't have to re-calculate next time
     * if blockchain hasn't changed - will be super quick
     * @param blockchain Blockchain to use for calculating the wallet balance.
     */
    calculateBalance(blockchain: Blockchain): number {
        this.lastBlockTimestamp = blockchain.chain[blockchain.chain.length-1].timestamp;
        let balance = this.balance;
        const newTransactions: Transaction [] = [];

        //balance already up to date, no need for recalculation
        if(this.lastBlockBalanceCalc === this.lastBlockTimestamp &&
            this.lastBlockBalanceCalc > 0) { //balance already calculated at least once
            return balance;
        }

        //start from end of blockchain to find where to start recalculating from
        //as blockchain grows, won't waste time rechecking old blocks
        let startBlockIndex = 0;
        let blocks: Block [] = blockchain.chain;
        for(let i=blocks.length-1; i>=0; i--) {
            if(blocks[i].timestamp === this.lastBlockBalanceCalc) {
                //calculation should start from 1 block AFTER the last block used to calculate balance
                startBlockIndex = i + 1;
                break;
            }
        }
        //only add transactions from new blocks mined since last time calculated balance
        for(let i=startBlockIndex; i<blocks.length; i++) {
            let blockTransactions: Transaction [] = <Transaction []> blocks[i].data;
            for(let j=0; j<blockTransactions.length; j++) {
                newTransactions.push(blockTransactions[j]);
            }
        }
        //find all of this wallet's input transactions - i.e. withdrawals to other wallets
        const thisWalletWithdrawalTxs = newTransactions.filter(
            transaction => transaction.txInput.address === this.publicKey);

        //find all of this wallet's output transactions (where it's not in the input transaction)- i.e. deposits from other wallets
        const thisWalletDepositTxs = newTransactions.filter(
            transaction => {
                //start from index 1 for TransactionOutputs because index 0 holds temporary balance
                for(let i=1; i<transaction.txOutputs.length; i++) {
                    if(transaction.txOutputs[i].address === this.publicKey &&
                        transaction.txInput.address !== this.publicKey) return true;
                }
                return false;
            });

        //subtract all new withdrawals from this wallet
        for(let i=0; i<thisWalletWithdrawalTxs.length; i++) {
            //start from index 1 for TransactionOutputs because index 0 holds temporary balance
            for(let j=1; j<thisWalletWithdrawalTxs[i].txOutputs.length; j++) {
                balance -= thisWalletWithdrawalTxs[i].txOutputs[j].amount;
            }
        }

        //add all new deposits to this wallet
        for(let i=0; i<thisWalletDepositTxs.length; i++) {
            //start from index 1 for TransactionOutputs because index 0 holds temporary balance
            for(let j=1; j<thisWalletDepositTxs[i].txOutputs.length; j++) {
                if(thisWalletDepositTxs[i].txOutputs[j].address === this.publicKey) {
                    balance += thisWalletDepositTxs[i].txOutputs[j].amount;
                }
            }
        }

        //set so next time won't have to re-check any block if blockchain unchanged
        this.lastBlockBalanceCalc = this.lastBlockTimestamp;
        this.balance = balance;
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