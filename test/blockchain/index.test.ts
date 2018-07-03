import Blockchain from "../../src/blockchain";
import Block from "../../src/blockchain/block";
import Transaction from "../../src/wallet/transaction";

describe('Blockchain', () => {
    let bc: Blockchain;
    let bc2: Blockchain;

    beforeEach(() => {
        bc = new Blockchain();
        bc2 = new Blockchain();
    });
    
    test("starts with Genesis Block", () => {
        expect(bc.chain[0]).toEqual(Block.getGenesisBlock());
    });

    test("adds new block", () => {
        let data:string = "barData";
        let newBlock = bc.addBlock(data);

        //test for data equality
        expect(data).toEqual(bc.chain[1].data);
        expect(data).toEqual(bc.chain[bc.chain.length-1].data);
        expect(newBlock.data).toEqual(data);

        //test for Block equality
        expect(newBlock).toEqual(bc.chain[1]);
        expect(newBlock).toEqual(bc.chain[bc.chain.length-1]);
    });

    test("validate chain - valid chain", () => {
        bc2.addBlock("foo");
        expect(bc.isValidChain(bc2.chain)).toBe(true);
    });

    test("invalidates chain - corrupt genesis data", () => {
        bc2.chain[0].data = [new Transaction()];
        expect(bc.isValidChain(bc2.chain)).toBe(false);
    });

    test("invalidate chain - corrupt genesis hash", () => {
        bc2.chain[0].hash = "corrupt";
        expect(bc.isValidChain(bc2.chain)).toBe(false);
    });

    test("validate chain - invalid chain - corrupt non-genesis data", () => {
        bc2.addBlock("foo");
        bc2.chain[1].data = "corrupted";
        expect(bc.isValidChain(bc2.chain)).toBe(false);
    });

    test("validate chain - invalid chain - corrupt non-genesis hash", () => {
        bc2.addBlock("foo");
        bc2.chain[1].hash = "corrupt";
        expect(bc.isValidChain(bc2.chain)).toBe(false);
    });

    test("replace blockchain with valid chain", () => {
        //bc2 got new block so it's longer than bc
        bc2.addBlock("new block");

        //node 1 should get updated
        expect(bc.replaceChain(bc2.chain)).toBe(true);

        expect(bc.chain).toEqual(bc2.chain);
    });

    test("does NOT replace blockchain - new chain is too short", () => {
        //node 2 got new block
        bc.addBlock("new block");

        //node 2 should NOT get updated with node 1's chain
        expect(bc.replaceChain(bc2.chain)).toBe(false);

        expect(bc.chain).not.toEqual(bc2.chain); 
    });

    test("replace blockchain - invalid - corrupt data", () => {
        //node 2 got new block
        bc2.addBlock("new block");

        bc2.chain[1].data = [new Transaction()];

        //node 1 should NOT get updated - node 2's blockchain is corrupted
        expect(bc.replaceChain(bc2.chain)).toBe(false);

        expect(bc.chain).not.toEqual(bc2.chain);
    })
});