import Transaction from "../../src/wallet/transaction";
import Output from "../../src/wallet/output";
import Wallet from "../../src/wallet";

describe("Transaction", () => {
    let transaction: Transaction, wallet: Wallet, recipient: string, amount: number;

    beforeEach(() => {
        wallet = new Wallet();
        amount = 50;
        recipient = "r3c1p13nt";
        transaction = Transaction.newTransaction(wallet, recipient, amount);
    });

    test("outputs the amount subtracted from wallet balance", () => {
        //find the output object who's address matches the wallet's public key
        const senderOutput  = <Output> transaction.outputs.find(output => output.address === wallet.publicKey);

        expect(senderOutput.amount).toEqual(wallet.balance - amount);
    });

    test("amount added to recipient amount", () =>{
        const recipientOutput = <Output> transaction.outputs.find(output => output.address === recipient);

        expect(recipientOutput.amount).toEqual(amount);
    });

    describe("transacting with amount that exceeds balance", () => {
        test("does NOT create the transaction and throws error", ()=>{
            amount = 50000;
            expect(() => {
                Transaction.newTransaction(wallet, recipient, amount)
            }).toThrowError('exceeds');
        })
    })    
})

