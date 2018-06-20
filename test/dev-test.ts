const Block = require('../src/block');

const block = new Block('foo11', 'foo22', 'foo333', 'foo4444');

console.log(block.toString());
console.log(Block.genesis().toString());
