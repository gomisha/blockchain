import { Blockchain } from "../src/blockchain";
import { Block } from "../src/block";

describe('Blockchain', () => {
    let blockchain: Blockchain;

    beforeEach(() => {
        blockchain = new Blockchain();
    });
    
    it("starts with Genesis Block", () => {
        expect(blockchain.chain[0]).toEqual(Block.getGenesisBlock());
    });

    it("adds new block", () => {
        let data:string = "barData";
        let newBlock = blockchain.addBlock(data);

        //test for data equality
        expect(data).toEqual(blockchain.chain[1].data);
        expect(data).toEqual(blockchain.chain[blockchain.chain.length-1].data);
        expect(newBlock.data).toEqual(data);

        //test for Block equality
        expect(newBlock).toEqual(blockchain.chain[1]);
        expect(newBlock).toEqual(blockchain.chain[blockchain.chain.length-1]);
    });
});