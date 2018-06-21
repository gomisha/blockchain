import { Block } from "../src/block";

describe('block', () => {
	let data, lastBlock, block;
	
	beforeEach(() =>{
		block = new Block(123, 'foo2', 'foo3', 'foo4');
		data = 'test1';
		lastBlock = Block.getGenesisBlock();
		block = Block.mineNewBlock(lastBlock, data);
	});
	
	it('sets data to match input', () => {
		expect(block.data).toEqual(data);
	});
	
	it('sets last hash to match hash of last block', () =>{
		expect(block.lastHash).toEqual(lastBlock.hash);
	});
});