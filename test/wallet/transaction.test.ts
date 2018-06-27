import Transaction from "../../src/wallet/transaction";
import TransactionInput from "../../src/wallet/transaction-input";
import Wallet from "../../src/wallet";

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
        const senderTxInput  = <TransactionInput> transaction.txOutputs.find(output => output.address === senderWallet.publicKey);

        expect(senderTxInput.amount).toEqual(senderWallet.balance - firstTxAmount);
    });

    test("amount added to recipient amount", () => {
        const recipientTxInput = <TransactionInput> transaction.txOutputs.find(output => output.address === recipient);

        expect(recipientTxInput.amount).toEqual(firstTxAmount);
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
    })

    test("verifyTransaction - invalid transaction - output corrupted", ()=>{
        transaction.txOutputs[0].amount = 10000;
        expect(Transaction.verifyTransaction(transaction)).toBe(false);
    })

    describe("transacting with amount that exceeds balance", () => {
        test("does NOT create the transaction and throws error", ()=>{
            firstTxAmount = 50000;
            expect(() => {
                Transaction.newTransaction(senderWallet, recipient, firstTxAmount)
            }).toThrowError('exceeds');
        });
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
            const senderTxInput  = <TransactionInput> transaction.txOutputs.find(
                output => output.address === senderWallet.publicKey);

            //sender's balance should've had 2 subtractions - 1 for each transfer
            expect(senderTxInput.amount).toEqual(senderWallet.balance - firstTxAmount - secondTxAmount);
        });


        test("outputs an amount for 2nd recipient", ()=> {
            const nextRecipientTxInput  = <TransactionInput> transaction.txOutputs.find(
                output => output.address === nextRecipient);
            //2nd recipients receives transfer
            expect(nextRecipientTxInput.amount).toEqual(secondTxAmount);
        });

    })

    describe("updating transaction - error", () => {
        test("does NOT update transaction - sender tried to send too much on 2nd transfer", () => {

            let secondTxAmount: number = 5000; //trying to transfer too much
            let nextRecipient: string = "n3xt-4ddr355";

            expect(() => {
                transaction = transaction.update(senderWallet, nextRecipient, secondTxAmount);
            }).toThrowError('exceeds');
        })
    });
})

