import Block from "../../src/blockchain/block";

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
		expect(block.hash.substring(0, block.difficulty)).toEqual('0'.repeat(block.difficulty));
	})

	it("adjustDifficulty() - lowers difficulty for slowly mined blocks", () => {
		//add a really large number to timestampe - to simulate a really long time taken to mine new block
		//should decrease difficulty level by 1
		expect(Block.adjustDifficulty(block, block.timestamp + 360000)).toEqual(block.difficulty-1);
	})

	it("adjustDifficulty() - raises difficulty for quickly mined blocks", () => {
		//add a really small number to timestampe - to simulate a really short time taken to mine new block
		//should increase difficulty level by 1
		expect(Block.adjustDifficulty(block, block.timestamp + 1)).toEqual(block.difficulty+1);
	})
});