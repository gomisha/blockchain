import { Block } from "../src/block";

const block = new Block(Date.now(), "foo22", "foo333", "foo4444");

console.log(block.toString());
console.log(Block.getGenesisBlock().toString());

const minedBlock1 = Block.mineNewBlock(Block.getGenesisBlock(), "mined1");

console.log("minedBlock1:" + minedBlock1.toString());

const minedBlock2 = Block.mineNewBlock(Block.getGenesisBlock(), "mined2");

console.log("minedBlock2:" + minedBlock2.toString());