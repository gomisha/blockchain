import Block from "../../src/blockchain/block";

describe('Block', () => {
	let data:string, previousBlock:Block, block:Block;

	beforeEach(() => {
		data = 'test1';
		previousBlock = Block.getGenesisBlock();
		block = Block.mineNewBlock(previousBlock, data);
	});
	
	test('sets data to match input', () => {
		expect(block.data).toEqual(data);
	});
	
	test('sets last hash to match hash of last block', () => {
		expect(block.lastHash).toEqual(previousBlock.hash);
	});

	test('generates a hash that matches difficulty level', () => {
		expect(block.hash.substring(0, block.difficulty)).toEqual('0'.repeat(block.difficulty));
	});

	test("adjustDifficulty() - lowers difficulty for slowly mined blocks", () => {
		//add a really large number to timestamp - to simulate a really long time taken to mine new block
		//should decrease difficulty level by 1
		expect(Block.adjustDifficulty(block, block.timestamp + 360000)).toEqual(block.difficulty-1);
	});

	test("adjustDifficulty() - raises difficulty for quickly mined blocks", () => {
		//add a really small number to timestampe - to simulate a really short time taken to mine new block
		//should increase difficulty level by 1
		expect(Block.adjustDifficulty(block, block.timestamp + 1)).toEqual(block.difficulty+1);
	});

	test("adjustDifficulty() - doesn't lower difficulty below 1", () => {
		let calculatedDifficulty: number = 100;
		let lowestDifficultyReached: boolean = false;
		for(let i=0; i<3; i++) {
			calculatedDifficulty = Block.adjustDifficulty(block, block.timestamp + 360000);
			//adjust block difficulty for next difficulty calculation
			block.difficulty = calculatedDifficulty;
			if(calculatedDifficulty === 1) {
				lowestDifficultyReached = true;
				//simulate mining new block slowly after reaching lowest difficulty
				calculatedDifficulty = Block.adjustDifficulty(block, block.timestamp + 360000);

				//check that it stays at 1 even if the previous block had
				//difficulty of 1 and next block took a long time to mine
				expect(calculatedDifficulty).toEqual(1);
			}
		}
		expect(lowestDifficultyReached).toBe(true);
		expect(calculatedDifficulty).toEqual(1);
	});
});