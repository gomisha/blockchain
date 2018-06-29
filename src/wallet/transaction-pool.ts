import Transaction from "./transaction";

export default class TransactionPool {
    transactions: Transaction [];

    constructor() {
        this.transactions = [];
    }

    updateOrAddTransaction(transaction: Transaction): void {
        let foundTx: Transaction = <Transaction> this.transactions.find(tx => tx.id === transaction.id);

        //transaction already exists so it needs to replaced
        if(foundTx) {
            this.transactions[this.transactions.indexOf(foundTx)] = transaction;
        }
        //transaction doesn't exist already in the pool, so will be added
        else {
            this.transactions.push(transaction);
       }
    }

    findTransaction(address: string): Transaction {
        return <Transaction> this.transactions.find(tx => tx.txInput.address === address);
    }

    /**
     * Validates transactions by:
     * - checking that the TransactionInput's starting balance + all subsequent TransactionOutputs = current balance
     * - verify signature of every transaction
     * @returns Array of valid transactions.
     */
    validTransactions() : Transaction [] {
        let validTransactions: Transaction [] = [];

        this.transactions.forEach(tx => {
            let startingBalance = tx.txInput.amount;
            let outputBalance:number = 0;
            tx.txOutputs.forEach(txOutput => {
                outputBalance += txOutput.amount;
            })
            if(outputBalance !== startingBalance) {
                console.log("Invalid transaction (balance) from address: " + tx.txInput.address);
                return;
            }
            if(!Transaction.verifyTransaction(tx)) {
                console.log("Invalid transaction (signature) from address: " + tx.txInput.address);
                return;
            }
            validTransactions.push(tx);
        });

        return validTransactions;
    }
}