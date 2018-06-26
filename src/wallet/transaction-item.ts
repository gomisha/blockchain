export default class TransactionItem {
    amount: number;
    address: string;
    timestamp: number;
    constructor(amount: number, address: string) {
        this.amount = amount;
        this.address = address;
    }
}