import Wallet from "../../src/wallet";
import TransactionPool from "../../src/wallet/transaction-pool";
import Transaction from "../../src/wallet/transaction";
import TransactionOutput from "../../src/wallet/transaction-output";
import Blockchain from "../../src/blockchain";
import { INITIAL_BALANCE } from "../../src/config";

describe("Wallet", () => {
    let tp: TransactionPool, wallet: Wallet, blockchain: Blockchain;
    let transaction: Transaction, sendAmount: number, recipient: string;

    beforeEach(() => {
        wallet = new Wallet();
        tp = new TransactionPool();
        blockchain = new Blockchain();

        sendAmount = 50;
        recipient = "random-address";
        transaction = wallet.createOrUpdateTransaction(recipient, sendAmount, blockchain, tp);

    });

    test("transaction exceeds balance and throws error", () => {
        expect(() => {
            wallet.createOrUpdateTransaction(recipient, 1000, blockchain, tp);
        }).toThrowError('exceeds');
    });

    describe("create 2nd identical transaction", () => {
        beforeEach(() => {
            wallet.createOrUpdateTransaction(recipient, sendAmount, blockchain, tp);
        });

        test("double the `sendAmount` subtracted from the wallet balance", () => {
            let foundTxOutput = <TransactionOutput> transaction.txOutputs.find(
                txOutput => txOutput.address === wallet.publicKey);
            
            const expectedWalletBalance = wallet.balance - sendAmount * 2;
            expect(foundTxOutput.amount).toEqual(expectedWalletBalance);
        });

        test("clones the `sendAmount` output for the recipient", () => {
            let foundTxOutputs = <TransactionOutput []> transaction.txOutputs.filter(
                txOutput => txOutput.address === recipient);

            expect(foundTxOutputs.length).toBe(2);

            expect(foundTxOutputs[0].amount).toBe(sendAmount);
            expect(foundTxOutputs[1].amount).toBe(sendAmount);
        });
    });

    describe("calculating balance", () => {
        let addBalance:number, repeadAdd:number, senderWallet: Wallet;

        beforeEach(() => {
            senderWallet = new Wallet();
            addBalance = 100;
            repeadAdd = 3;

            for(let i=0; i<repeadAdd; i++) {
                let newTx = senderWallet.createOrUpdateTransaction(wallet.publicKey, addBalance, blockchain, tp);
            }
            blockchain.addBlock(tp.transactions);
        });

        test("calculates balance for blockchain transactions matching the recipient", () => {
            //subtract initial sendAmount from higher level beforeEach()
            const expectedBalance: number = INITIAL_BALANCE + (addBalance * repeadAdd) - sendAmount;
            expect(wallet.calculateBalance(blockchain)).toEqual(expectedBalance);
        });

        test("calculates balance for blockchain transactions matching the sender", () => {
            const expectedBalance = INITIAL_BALANCE - (addBalance * repeadAdd);
            expect(senderWallet.calculateBalance(blockchain)).toEqual(expectedBalance);
        });

        describe("and recipient conducts transaction - should calculate balance only since last transaction", () => {
            let subtractBalance: number, recipientBalance: number;

            beforeEach(() => {
                tp.clear(); //make sure old transactions are processed
                subtractBalance = 60;
                recipientBalance = wallet.calculateBalance(blockchain);
    
                //recipient now conducts new transaction
                wallet.createOrUpdateTransaction(senderWallet.publicKey, subtractBalance, blockchain, tp);
    
                blockchain.addBlock(tp.transactions);
            });

            describe("and the sender sends another transaction to recipient", () => {
                beforeEach(() => {
                    tp.clear();
                    senderWallet.createOrUpdateTransaction(wallet.publicKey, addBalance, blockchain, tp);
                    blockchain.addBlock(tp.transactions);
                });

                test("calculates recipient balance since most recent receipt transactions", () => {
                    const expectedBalance = recipientBalance - subtractBalance + addBalance;
                    expect(wallet.calculateBalance(blockchain)).toEqual(expectedBalance);
                });
            });
        });
    });
});

