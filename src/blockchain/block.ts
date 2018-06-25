import * as crypto from "crypto-js";
import * as config from "../config";

export class Block {
	timestamp: number;
	lastHash: string;
	hash: string;
	nonce: number;
	data: string;

	constructor(timestamp: number, lastHash: string, hash: string, nonce:number, data: string) {
		this.timestamp = timestamp;
		this.lastHash = lastHash;
		this.hash = hash;
		this.data = data;
		this.nonce = nonce;
	}

	/**
	 * First block of the blockchain.
	 */
	static getGenesisBlock(): Block {
		return new this(0, '-----', 'f1r5t-ha4h', 0, '');
	}

	/**
	 * Mines new block that will be added to the blockchain.
	 * @param lastBlock Link to the previous block for storing its hash.
	 * @param data Data to store of the new block.
	 */
	static mineNewBlock(lastBlock: Block, data: string): Block {
		let timestamp: number;
		const lastHash: string = lastBlock.hash;
		let nonce:number = 0;
		let hash:string;
		//PROOF OF WORK - keep generating new hashes until get specific number of leading 0's
		do {
			timestamp = Date.now();
			nonce++;
			hash = Block.generateHash(timestamp, lastHash, nonce, data);
		} while(hash.substr(0, config.DIFFICULTY) !== "0".repeat(config.DIFFICULTY));
		return new this(timestamp, lastHash, hash, nonce, data)
	}

	static generateHash(timestamp: number, lastHash: string, nonce: number, data: string): string {
		return crypto.SHA256(`${timestamp}${lastHash}${nonce}${data}`).toString();
	}

	/**
	 * Convenience method to generate hash based on a block - used for validation.
	 * @param block The block to generate hash from.
	 */
	static generateHash2(block: Block): string {
		const { timestamp, lastHash, nonce, data} = block;
		return Block.generateHash(timestamp, lastHash, nonce, data);
	}

	toString(): string {
		return `Block:
			Timestamp: ${this.timestamp}
			Last Hash: ${this.lastHash.substring(0,10)}
			Hash     : ${this.hash.substring(0,10)}
			Nonce    : ${this.nonce}			
			Data     : ${this.data}
		`;
	}
}