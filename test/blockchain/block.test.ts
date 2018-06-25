import { Block } from "../../src/blockchain/block";

import * as config from "../../src/config";

describe('Block', () => {
	let data:string, previousBlock:Block, block:Block;
	
	beforeEach(() => {
		data = 'test1';
		previousBlock = Block.getGenesisBlock();
		block = Block.mineNewBlock(previousBlock, data);
	});
	
	it('sets data to match input', () => {
		expect(block.data).toEqual(data);
	});
	
	it('sets last hash to match hash of last block', () => {
		expect(block.lastHash).toEqual(previousBlock.hash);
	});

	it('generates a hash that matches difficulty level', () => {
		expect(block.hash.substring(0, config.DIFFICULTY)).toEqual('0'.repeat(config.DIFFICULTY));
		console.log(block.toString());
	})
});