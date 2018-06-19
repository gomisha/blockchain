const Block = require('../src/block');

const block = new Block('foo1', 'foo2', 'foo3', 'foo4');

console.log(block.toString());
console.log(Block.genesis().toString());
