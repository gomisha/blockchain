import Transaction from "../../src/wallet/transaction";
import TransactionOutput from "../../src/wallet/transaction-output";
import TransactionInput from "../../src/wallet/transaction-input";
import Wallet from "../../src/wallet";
import * as config from "../../src/config";

describe("Transaction", () => {
    let transaction: Transaction, senderWallet: Wallet, recipient: string, firstTxAmount: number;

    beforeEach(() => {
        senderWallet = new Wallet();
        firstTxAmount = 50;
        recipient = "r3c1p13nt";
        transaction = Transaction.newTransaction(senderWallet, recipient, firstTxAmount);
    });

    test("outputs the amount subtracted from wallet balance", () => {
        //find the output object who's address matches the wallet's public key
        const senderTxOutput  = <TransactionOutput> transaction.txOutputs.find(
            txOutput => txOutput.address === senderWallet.publicKey);

        expect(senderTxOutput.amount).toEqual(senderWallet.balance - firstTxAmount);
    });

    test("amount added to recipient amount", () => {
        const recipientTxOutput = <TransactionOutput> transaction.txOutputs.find(
            txOutput => txOutput.address === recipient);

        expect(recipientTxOutput.amount).toEqual(firstTxAmount);
    });

    test("inputs the balance of the wallet", () => {
        expect(transaction.txInput.amount).toEqual(senderWallet.balance);
    });

    test("verifyTransaction - valid transaction", ()=> {
        expect(Transaction.verifyTransaction(transaction)).toBe(true);
    });

    test("verifyTransaction - valid transaction - input balance corrupted", ()=>{
        transaction.txInput.amount = 10000;
        //input balance isn't part of signature, so won't matter if it was corrupted
        expect(Transaction.verifyTransaction(transaction)).toBe(true);
    });

    test("verifyTransaction - invalid transaction - input signature corrupted", () => {
        transaction.txInput.signature = "123456abcdef"; //signature changed
        expect(Transaction.verifyTransaction(transaction)).toBe(false);
    });

    test("verifyTransaction - invalid transaction - output corrupted", ()=> {
        transaction.txOutputs[0].amount = 10000;
        expect(Transaction.verifyTransaction(transaction)).toBe(false);
    });

    test("transacting with amount that exceeds balance - does NOT create the transaction and throws error", ()=> {
        firstTxAmount = 50000;
        expect(() => {
            Transaction.newTransaction(senderWallet, recipient, firstTxAmount)
        }).toThrowError('exceeds');
    });

    describe("updating transaction - successful", () => {
        let secondTxAmount: number, nextRecipient: string;

        beforeEach(() => {
            secondTxAmount = 50;
            nextRecipient = "n3xt-4ddr355";
            transaction = transaction.update(senderWallet, nextRecipient, secondTxAmount);
        });

        test("subtracts the 2nd amount from sender's output", () => {
            //find the output object who's address matches the wallet's public key
            const senderTxOutput  = <TransactionOutput> transaction.txOutputs.find(
                output => output.address === senderWallet.publicKey);

            //sender's balance should've had 2 subtractions - 1 for each transfer
            expect(senderTxOutput.amount).toEqual(senderWallet.balance - firstTxAmount - secondTxAmount);
        });


        test("outputs an amount for 2nd recipient", ()=> {
            const nextRecipientTxOutput  = <TransactionOutput> transaction.txOutputs.find(
                output => output.address === nextRecipient);
            //2nd recipients receives transfer
            expect(nextRecipientTxOutput.amount).toEqual(secondTxAmount);
        });
    })

    describe("updating transaction - error", () => {
        test("does NOT update transaction - sender tried to send too much on 2nd transfer", () => {

            let secondTxAmount: number = 5000; //trying to transfer too much
            let nextRecipient: string = "n3xt-4ddr355";

            expect(() => {
                transaction = transaction.update(senderWallet, nextRecipient, secondTxAmount);
            }).toThrowError('exceeds');
        });
    });

    describe("creating reward transaction", () => {
        beforeEach(() => {
            transaction = Transaction.newRewardTransaction(senderWallet, Wallet.getBlockchainWallet());
        })

        test("reward the miner's wallet", () => {
            let txOutput = <TransactionOutput> transaction.txOutputs.find(txOutput => 
                txOutput.address === senderWallet.publicKey);
            expect(txOutput.amount).toEqual(config.MINING_REWARD);

            //blockchain wallet should have special address
            expect(Wallet.getBlockchainWallet().publicKey).toEqual(config.BLOCKCHAIN_WALLET_ADDRESS);
        });
    });
});