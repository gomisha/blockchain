import Wallet from "../../src/wallet";
import TransactionPool from "../../src/wallet/transaction-pool";
import Transaction from "../../src/wallet/transaction";
import TransactionOutput from "../../src/wallet/transaction-output";
import Blockchain from "../../src/blockchain";
import { INITIAL_BALANCE } from "../../src/config";

describe("Wallet", () => {
    let tp: TransactionPool, wallet1: Wallet, blockchain: Blockchain;
    let transaction: Transaction, sendAmount: number, recipient: string;

    beforeEach(() => {
        wallet1 = new Wallet();
        tp = new TransactionPool();
        blockchain = new Blockchain();

        sendAmount = 50;
        recipient = "random-address";
        transaction = wallet1.createOrUpdateTransaction(recipient, sendAmount, blockchain, tp);
    });

    test("transaction exceeds balance (single transaction) and throws error", () => {
        expect(() => {
            wallet1.createOrUpdateTransaction(recipient, 1000, blockchain, tp);
        }).toThrowError('exceeds');
    });

    test("exceeds balance with multiple small transactions and throws error", () => {
        wallet1.createOrUpdateTransaction("foo", 200, blockchain, tp);
        wallet1.createOrUpdateTransaction("bar", 200, blockchain, tp); 

        //should only have 50 left (500 - 50 - 200 - 200) in pending balance 
        //so shouldn't be allowed to transfer more than that
        expect(() => {
            wallet1.createOrUpdateTransaction("baz", 51, blockchain, tp);
        }).toThrowError('exceeds');
    });

    describe("create 2nd identical transaction", () => {
        beforeEach(() => {
            wallet1.createOrUpdateTransaction(recipient, sendAmount, blockchain, tp);
        });

        test("double the `sendAmount` subtracted from the wallet balance", () => {
            let foundTxOutput = <TransactionOutput> transaction.txOutputs.find(
                txOutput => txOutput.address === wallet1.publicKey);

            const expectedWalletBalance = wallet1.balance - sendAmount * 2;
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
        let transfer1:number, repeadAdd:number, wallet2: Wallet;

        beforeEach(() => {
            tp.clear(); //clear any previous transactions
            wallet2 = new Wallet();
            transfer1 = 10;
            repeadAdd = 3;

            for(let i=0; i<repeadAdd; i++) {
                wallet2.createOrUpdateTransaction(wallet1.publicKey, transfer1, blockchain, tp);
            }
            blockchain.addBlock(tp.transactions);
        });

        test("calculates balance for blockchain transactions matching the recipient", () => {
            //subtract initial sendAmount from higher level beforeEach()
            const expectedBalance = INITIAL_BALANCE + (transfer1 * repeadAdd);
            expect(wallet1.calculateBalance(blockchain)).toEqual(expectedBalance);
        });

        test("calculates balance for blockchain transactions matching the sender", () => {
            const expectedBalance = INITIAL_BALANCE - (transfer1 * repeadAdd);
            expect(wallet2.calculateBalance(blockchain)).toEqual(expectedBalance);
        });

        describe("and recipient conducts transaction - should calculate balance only since last transaction", () => {
            let transfer2: number, transfer3: number, transfer4: number, transfer5: number, startingBalance: number;

            beforeEach(() => {
                tp.clear(); //make sure old transactions are processed
                transfer2 = 60;
                transfer3 = 101;
                transfer4 = 57;
                transfer5 = 10;
                startingBalance = wallet1.calculateBalance(blockchain);
            });

            test("calculates recipient balance since most recent receipt transactions", () => {
                //recipient now conducts new transaction
                wallet1.createOrUpdateTransaction(wallet2.publicKey, transfer2, blockchain, tp);
    
                blockchain.addBlock(tp.transactions);

                tp.clear();

                wallet2.createOrUpdateTransaction(wallet1.publicKey, transfer1, blockchain, tp);
                blockchain.addBlock(tp.transactions);

                const expectedBalance = startingBalance - transfer2 + transfer1;
                expect(wallet1.calculateBalance(blockchain)).toEqual(expectedBalance);
            });


            describe("transfer back and forth between 2 wallets", () => {
                function mineMock(): void {
                    blockchain.addBlock(tp.transactions);
                    tp.clear();
                }

                let wallet3:Wallet, wallet4: Wallet, wallet5: Wallet;
                beforeEach(() => {
                    wallet3 = new Wallet();
                    wallet4 = new Wallet();
                    wallet5 = new Wallet();
                    tp.clear();
                });
                test("transfer back and forth between 3 wallets - mine after EACH transfer", () => {
                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 3 ------> WALLET 4 (transfer1)
                    wallet3.createOrUpdateTransaction(wallet4.publicKey, transfer1, blockchain, tp);
                    mineMock();

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE - transfer1);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer1);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE - transfer1);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE + transfer1);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 4 -----> WALLET 3 (transfer1)
                    wallet4.createOrUpdateTransaction(wallet3.publicKey, transfer1, blockchain, tp);
                    mineMock();

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 3 ----> WALLET 4 (transfer2)
                    wallet3.createOrUpdateTransaction(wallet4.publicKey, transfer2, blockchain, tp);
                    mineMock();

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE - transfer2);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer2);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE - transfer2);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE + transfer2);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 3 ----> WALLET 5 (transfer3)
                    wallet3.createOrUpdateTransaction(wallet5.publicKey, transfer3, blockchain, tp);
                    mineMock();

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE - transfer2 - transfer3);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer2);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer3);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE - transfer2 - transfer3);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE + transfer2);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE + transfer3);

                    //WALLET 5 ---> WALLET 4 (transfer4)
                    wallet5.createOrUpdateTransaction(wallet4.publicKey, transfer4, blockchain, tp);
                    mineMock();

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE - transfer2 - transfer3);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer2 + transfer4);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer3 - transfer4);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE - transfer2 - transfer3);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE + transfer2 + transfer4);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE + transfer3 - transfer4);

                    //WALLET 5 ---> WALLET 3 (transfer5)
                    wallet5.createOrUpdateTransaction(wallet3.publicKey, transfer5, blockchain, tp);
                    mineMock();

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE - transfer2 - transfer3 + transfer5);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer2 + transfer4);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer3 - transfer4 - transfer5);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE - transfer2 - transfer3 + transfer5);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE + transfer2 + transfer4);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE + transfer3 - transfer4 - transfer5);
                });

                test("transfer back and forth between 3 wallets - mine after ALL transfers", () => {
                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 3 ------> WALLET 4 (transfer1)
                    wallet3.createOrUpdateTransaction(wallet4.publicKey, transfer1, blockchain, tp);

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 4 -----> WALLET 3 (transfer1)
                    wallet4.createOrUpdateTransaction(wallet3.publicKey, transfer1, blockchain, tp);

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 3 ----> WALLET 4 (transfer2)
                    wallet3.createOrUpdateTransaction(wallet4.publicKey, transfer2, blockchain, tp);

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 3 ----> WALLET 5 (transfer3)
                    wallet3.createOrUpdateTransaction(wallet5.publicKey, transfer3, blockchain, tp);

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 5 ---> WALLET 4 (transfer4)
                    wallet5.createOrUpdateTransaction(wallet4.publicKey, transfer4, blockchain, tp);

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE);

                    //WALLET 5 ---> WALLET 3 (transfer5)
                    wallet5.createOrUpdateTransaction(wallet3.publicKey, transfer5, blockchain, tp);
                    mineMock();

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE - transfer2 - transfer3 + transfer5);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer2 + transfer4);
                    expect(wallet5.calculateBalance(blockchain)).toBe(INITIAL_BALANCE + transfer3 - transfer4 - transfer5);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE - transfer2 - transfer3 + transfer5);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE + transfer2 + transfer4);
                    expect(wallet5.balance).toBe(INITIAL_BALANCE + transfer3 - transfer4 - transfer5);
                });

                test("transfer back and forth between 2 wallets - mine after both transfers", () => {
                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);

                    //WALLET 3 ------> WALLET 4 (transfer1)
                    wallet3.createOrUpdateTransaction(wallet4.publicKey, transfer1, blockchain, tp);
                    
                    //transaction hasn't been mined, so balance hasn't changed
                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);

                    //WALLET 4 -----> WALLET 3 (transfer1)
                    wallet4.createOrUpdateTransaction(wallet3.publicKey, transfer1, blockchain, tp);
                    mineMock();

                    expect(wallet3.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);
                    expect(wallet4.calculateBalance(blockchain)).toBe(INITIAL_BALANCE);

                    expect(wallet3.balance).toBe(INITIAL_BALANCE);
                    expect(wallet4.balance).toBe(INITIAL_BALANCE);
                });
            });
        });
    });
});
