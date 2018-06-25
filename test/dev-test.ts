import Blockchain from "../src/blockchain";
import Wallet from "../src/wallet";

let blockchain = new Blockchain();

// for(let i=0; i<10; i++) {
//     console.log(blockchain.addBlock("foo[" + i + "]").toString());
// }

const wallet = new Wallet();
console.log(wallet.toString());
