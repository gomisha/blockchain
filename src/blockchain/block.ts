import ChainUtil from "../chain-util";
import * as config from "../config";
import Transaction from "../wallet/transaction"
import TransactionInput from "../wallet/transaction-input";

export default class Block {
	timestamp: number;
	lastHash: string;
	hash: string;
	transactions: Transaction []; //transactions are the data in each block
	nonce: number;
	difficulty: number;
	
	constructor(timestamp: number, lastHash: string, hash: string, transactions: Transaction [], nonce:number, difficulty: number) {
		this.timestamp = timestamp;
		this.lastHash = lastHash;
		this.hash = hash;
		this.transactions = transactions;
		this.nonce = nonce;
		this.difficulty = difficulty;
	}

	/**
	 * First block of the blockchain.
	 */
	static getGenesisBlock(): Block {
		let genesisTransaction: Transaction = new Transaction();
		genesisTransaction.txInput = new TransactionInput(0, "genesis-transaction-input");
		genesisTransaction.id = "genesis-transaction-id";

		return new this(0, '-----', 'f1r5t-ha4h', [genesisTransaction], 0, config.DIFFICULTY);
	}

	/**
	 * Mines new block that will be added to the blockchain.
	 * @param lastBlock Link to the previous block for storing its hash.
	 * @param data Data to store of the new block.
	 */
	static mineNewBlock(lastBlock: Block, data: any): Block {
		let timestamp: number;
		const lastHash: string = lastBlock.hash;
		let nonce:number = 0;
		let hash:string;
		let {difficulty} = lastBlock;
		//PROOF OF WORK - keep generating new hashes until get specific number of leading 0's
		do {
			timestamp = Date.now();
			difficulty = Block.adjustDifficulty(lastBlock, timestamp);

			nonce++;
			hash = Block.generateHash(timestamp, lastHash, data, nonce, difficulty);
		} while(hash.substr(0, difficulty) !== "0".repeat(difficulty));
		return new this(timestamp, lastHash, hash, data, nonce, difficulty)
	}

	static generateHash(timestamp: number, lastHash: string, data: any, nonce: number, difficulty: number): string {
			return ChainUtil.genHash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`);
	}

	/**
	 * Convenience method to generate hash based on a block - used for validation.
	 * @param block The block to generate hash from.
	 */
	static generateHash2(block: Block): string {
		const { timestamp, lastHash, transactions, nonce, difficulty} = block;
		return Block.generateHash(timestamp, lastHash, transactions, nonce, difficulty);
	}

	/**
	 * Adjust difficulty level based on how long it took to mine new block. If new block was mined too quickly
	 * (by less than the mine rate), difficulty will be increased and if new block was mined too slowly
	 * difficulty will be decreased.
	 * @param lastBlock Previous block in the chain.
	 * @param newBlockTime Date stamp (in milliseonds from 1970) of (potential) new block.
	 */
	static adjustDifficulty(lastBlock: Block, newBlockTime: number): number {
		let { difficulty } = lastBlock;
		difficulty = lastBlock.timestamp + config.MINE_RATE > newBlockTime ? ++difficulty  : --difficulty;

		return difficulty;
	}

	toString(): string {
		return `Block:
			Timestamp  : ${this.timestamp}
			Last Hash  : ${this.lastHash.substring(0,10)}
			Hash       : ${this.hash.substring(0,10)}
			Data       : ${this.transactions}
			Nonce      : ${this.nonce}
			Difficulty : ${this.difficulty}
		`;
	}
}