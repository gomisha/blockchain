import { Block } from "../../src/blockchain/block";

describe('Block', () => {
	let data, previousBlock, block;
	
	beforeEach(() => {
		//block = new Block(123, 'foo2', 'foo3', 'foo4');
		data = 'test1';
		previousBlock = Block.getGenesisBlock();
		block = Block.mineNewBlock(previousBlock, data);
	});
	
	it('sets data to match input', () => {
		expect(block.data).toEqual(data);
	});
	
	it('sets last hash to match hash of last block', () =>{
		expect(block.lastHash).toEqual(previousBlock.hash);
	});
});