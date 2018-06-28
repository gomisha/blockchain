import TransactionPool from "../../src/wallet/transaction-pool";
import Transaction from "../../src/wallet/transaction";
import Wallet from "../../src/wallet";

describe("TransactionPool", () => {
    let tp: TransactionPool, wallet: Wallet, transaction: Transaction;
    const RECIPIENT_ADDRESS: string = "r4nd-4ddr355";

    beforeEach(() => {
        tp = new TransactionPool();
        wallet = new Wallet();
        transaction = Transaction.newTransaction(wallet, RECIPIENT_ADDRESS, 30);
        tp.updateOrAddTransaction(transaction);
    })

    test("adds transaction to the pool - transaction doesn't exist in pool", () => {
        const foundTransaction = <Transaction> tp.transactions.find(t => t.id === transaction.id);
        const transactions: string = JSON.stringify(tp.transactions);

        expect(foundTransaction).toEqual(transaction);
    })

    test("updates transaction in the pool - transaction exists in pool", () => {
        const oldTxString: string = JSON.stringify(transaction);

        //modify the transaction
        const updatedTx = transaction.update(wallet, "foo-bar", 100);
        const updatedTxString: string = JSON.stringify(updatedTx);

        tp.updateOrAddTransaction(transaction);
        expect(oldTxString).not.toEqual(updatedTxString);

        const foundTx = <Transaction> tp.transactions.find(tx => tx.id === updatedTx.id);
        const foundTxString: string = JSON.stringify(foundTx);

        expect(oldTxString).not.toEqual(foundTxString);
        expect(updatedTxString).toEqual(foundTxString);
    })
});