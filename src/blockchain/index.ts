import Block from "./block";

export default class Blockchain {
    chain: Block [];

    constructor() {
        this.chain = [Block.getGenesisBlock()];
    }

    /**
     * Adds new block to blockchain.
     * 
     * @param data Data of the new block
     * @returns Newest block added to blockchain
     */
    addBlock(data: any): Block {
        const newBlock = Block.mineNewBlock(this.chain[this.chain.length-1], data);
        this.chain.push(newBlock);

        return newBlock;
    }

    /**
     * Validates the chain by checking if:
     * - every element's last hash value matches previous block's hash
     * - data has been tampered with (which will produce a different hash value)
     * - genesis block's hash values match
     * @param blocks 
     */
    isValidChain(blocks: Block []): boolean {
        if(JSON.stringify(blocks[0]) !== JSON.stringify(Block.getGenesisBlock())) {
            return false;
        }

        for(let i:number=1; i<blocks.length; i++) {
            const currentBlock: Block = blocks[i];
            const previousBlock: Block = blocks[i-1];
            if(currentBlock.lastHash !== previousBlock.hash ||
               currentBlock.hash     !== Block.generateHash2(currentBlock)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param newBlocks The new blockchain that is a candidate for replacing the current blockchain.
     * @returns True if blockchain was replaced, false otherwise.
     */
    replaceChain(newBlocks: Block []): boolean {
        if(newBlocks.length <= this.chain.length) {
            console.log("New chain is not longer than current chain - NOT replacing.")
            return false;
        }
        if(!this.isValidChain(newBlocks)) {
            console.log("New chain is not valid - NOT replacing.")
            return false;
        }
        this.chain = newBlocks;
        console.log("Replacing current chain with new chain.")
        return true;
    }
}