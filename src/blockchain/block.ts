import SHA256 = require("crypto-js/sha256");

export class Block {
	timestamp: number;
	lastHash: string;
	hash: string;
	data: string;

	constructor(timestamp: number, lastHash: string, hash: string, data: string) {
		this.timestamp = timestamp;
		this.lastHash = lastHash;
		this.hash = hash;
		this.data = data;
	}

	/**
	 * First block of the blockchain.
	 */
	static getGenesisBlock(): Block {
		return new this(0, '-----', 'f1r5t-ha4h', '');
	}

	/**
	 * Mines new block that will be added to the blockchain.
	 * @param lastBlock Link to the previous block for storing its hash.
	 * @param data Data to store of the new block.
	 */
	static mineNewBlock(lastBlock: Block, data: string): Block {
		const timestamp: number = Date.now();
		const lastHash: string = lastBlock.hash;
		const hash:string  = Block.generateHash(timestamp, lastHash, data);
		return new this(timestamp, lastHash, hash, data)
	}

	static generateHash(timestamp: number, lastHash: string, data: string): string {
		return SHA256(`${timestamp}${lastHash}${data}`).toString();
	}

	/**
	 * Convenience method to generate hash based on a block - used for validation.
	 * @param block The block to generate hash from.
	 */
	static generateHash2(block: Block): string {
		const { timestamp, lastHash, data} = block;
		return Block.generateHash(timestamp, lastHash, data);
	}

	toString(): string {
		return `Block:
			Timestamp: ${this.timestamp}
			Last Hash: ${this.lastHash.substring(0,10)}
			Hash     : ${this.hash.substring(0,10)}
			Data     : ${this.data}
		`;
	}
}