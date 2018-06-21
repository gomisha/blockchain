import { Block } from "./block";

export class Blockchain {
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
    addBlock(data: string): Block {
        const newBlock = Block.mineNewBlock(this.chain[this.chain.length-1], data);
        this.chain.push(newBlock);

        return newBlock;
    }

    /**
     * Validates the chain by checking if:
     * - every element's last hash value matches previous block's hash
     * - data has been tampered with (which will produce a different hash value)
     * - genesis block's hash values match
     * @param chain 
     */
    isValidChain(chain: Block []): boolean {
        if(JSON.stringify(chain[0]) !== JSON.stringify(Block.getGenesisBlock())) {
            return false;
        }

        for(let i:number=1; i<chain.length; i++) {
            const currentBlock: Block = chain[i];
            const previousBlock: Block = chain[i-1];
            if(currentBlock.lastHash !== previousBlock.hash ||
               currentBlock.hash     !== Block.generateHash2(currentBlock)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 
     * @param blockchain The new blockchain that is a candidate for replacing the current blockchain.
     * @returns True if blockchain was replaced, false otherwise.
     */
    replaceChain(blockchain: Blockchain): boolean {
        if(blockchain.chain.length <= this.chain.length) {
            console.log("New chain is not longer than current chain - NOT replacing.")
            return false;
        }
        if(!this.isValidChain(blockchain.chain)) {
            console.log("New chain is not valid - NOT replacing.")
            return false;
        }
        this.chain = blockchain.chain;
        console.log("Replacing current chain with new chain.")
        return true;
    }
}