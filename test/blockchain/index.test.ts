import Blockchain from "../../src/blockchain";
import Block from "../../src/blockchain/block";

describe('Blockchain', () => {
    let blockchain: Blockchain;
    let blockchain2: Blockchain;

    beforeEach(() => {
        blockchain = new Blockchain();
        blockchain2 = new Blockchain();
    });
    
    test("starts with Genesis Block", () => {
        expect(blockchain.chain[0]).toEqual(Block.getGenesisBlock());
    });

    test("adds new block", () => {
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

    test("validate chain - valid chain", () => {
        blockchain2.addBlock("foo");
        expect(blockchain.isValidChain(blockchain2.chain)).toBe(true);
    });

    test("validate chain - invalid chain - corrupt genesis data", () => {
        blockchain2.chain[0].data = "corrupt";
        expect(blockchain.isValidChain(blockchain2.chain)).toBe(false);
    });

    test("validate chain - invalid chain - corrupt genesis hash", () => {
        blockchain2.chain[0].hash = "corrupt";
        expect(blockchain.isValidChain(blockchain2.chain)).toBe(false);
    });

    test("validate chain - invalid chain - corrupt non-genesis data", () => {
        blockchain2.addBlock("foo");
        blockchain2.chain[1].data = "corrupt";
        expect(blockchain.isValidChain(blockchain2.chain)).toBe(false);
    });

    test("validate chain - invalid chain - corrupt non-genesis hash", () => {
        blockchain2.addBlock("foo");
        blockchain2.chain[1].hash = "corrupt";
        expect(blockchain.isValidChain(blockchain2.chain)).toBe(false);
    });

    test("replace blockchain - valid", () => {
        //node 2 got new block
        blockchain2.addBlock("new block");

        //node 1 should get updated
        expect(blockchain.replaceChain(blockchain2)).toBe(true);

        expect(blockchain.chain).toEqual(blockchain2.chain);
    });

    test("replace blockchain - invalid - new chain is too short", () => {
        //node 2 got new block
        blockchain2.addBlock("new block");

        //node 2 should NOT get updated with node 1's chain
        expect(blockchain2.replaceChain(blockchain)).toBe(false);

        expect(blockchain.chain).not.toEqual(blockchain2.chain); 
    });

    test("replace blockchain - invalid - corrupt data", () => {
        //node 2 got new block
        blockchain2.addBlock("new block");

        blockchain2.chain[1].data = "corrupted";

        //node 1 should NOT get updated - node 2's blockchain is corrupted
        expect(blockchain.replaceChain(blockchain2)).toBe(false);

        expect(blockchain.chain).not.toEqual(blockchain2.chain);
    })
});