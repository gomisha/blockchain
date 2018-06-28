import Wallet from "../../src/wallet";
import TransactionPool from "../../src/wallet/transaction-pool";
import Transaction from "../../src/wallet/transaction";
import TransactionOutput from "../../src/wallet/transaction-output";

describe("Wallet", () => {
    let tp: TransactionPool, wallet: Wallet;
    let transaction: Transaction, sendAmount: number, recipient: string;

    beforeEach(() => {
        wallet = new Wallet();
        tp = new TransactionPool();

        sendAmount = 50;
        recipient = "random-address";
        transaction = wallet.createOrUpdateTransaction(recipient, sendAmount, tp);

    });

    test("transaction exceeds balance and throws error", () => {
        expect(() => {
            wallet.createOrUpdateTransaction(recipient, 1000, tp);
        }).toThrowError('exceeds');
    })

    describe("create 2nd identical transaction", () => {
        beforeEach(() => {
            wallet.createOrUpdateTransaction(recipient, sendAmount, tp);
        });

        test("double the `sendAmount` subtracted from the wallet balance", () => {
            let foundTxOutput = <TransactionOutput> transaction.txOutputs.find(
                txOutput => txOutput.address === wallet.publicKey);
            
            let expectedWalletBalance = wallet.balance - sendAmount * 2;

            expect(foundTxOutput.amount).toEqual(expectedWalletBalance);
        });

        test("clones the `sendAmount` output for the recipient", () => {
            let foundTxOutputs = <TransactionOutput []> transaction.txOutputs.filter(
                txOutput => txOutput.address === recipient);

            expect(foundTxOutputs.length).toBe(2);

            expect(foundTxOutputs[0].amount).toBe(sendAmount);
            expect(foundTxOutputs[1].amount).toBe(sendAmount);
        })
    })
})

