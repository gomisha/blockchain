class Block {

	constructor(timestamp, lastHash, hash, data) {
		this.timestamp = timestamp;
		this.lastHash = lastHash;
		this.hash = hash;
		this.data = data;
	}
	
	static genesis() {
		return new this('Genesis Time1111', '-----', '1111first-hash', []);
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

module.exports = Block;