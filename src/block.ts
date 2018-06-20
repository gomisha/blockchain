export class Block {
	timestamp: string;
	lastHash: string;
	hash: string;
	data: string;

	constructor(timestamp: string, lastHash: string, hash: string, data: string) {
		this.timestamp = timestamp;
		this.lastHash = lastHash;
		this.hash = hash;
		this.data = data;
	}
	
	static genesis() {
		return new this('Genesis Time', '-----', 'f1r5t-ha4h', '');
	}

	toString() {
		return `Block:
			Timestamp: ${this.timestamp}
			Last Hash: ${this.lastHash.substring(0,10)}
			Hash     : ${this.hash.substring(0,10)}
			Data     : ${this.data}
		`;
	}
}