var blessed = require('blessed'),
    contrib = require('blessed-contrib'),
    crypto = require('crypto'),
    underscore = require('underscore'),
    _ = underscore._


var screen = blessed.screen()

//create layout and widgets

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

screen.title = 'Two Blockchains';

// Grid.prototype.set = function(row, col, rowSpan, colSpan, obj, opts) {
var blockchain1Log = grid.set(0, 0, 12, 2, contrib.log, {
    border: {
      type: 'line',
    },
    label: "Miner 1's BlockChain",
    tags: true,
    bufferLength: 50
  }
)

var blockchain2Log = grid.set(0, 2, 12, 2, contrib.log, {
    border: {
      type: 'line',
    },
    label: "Miner 2's BlockChain",
    tags: true,
    bufferLength: 50
  }
)

var miningTable = grid.set(0, 4, 4, 8, contrib.table, {
    border: {
      type: 'line'
    },
    columnSpacing: 10,
    columnWidth: [26, 20, 20, 40],
    fg: 'yellow',
    interactive: false,
    label: 'Mining Rewards',
    tags: true
  }
)

var miner1Log = grid.set(4, 4, 4, 8, contrib.log, {
    border: {
      type: 'line'
    },
    fg: "red",
    label: 'Log for Miner 1'
  }
)

var miner2Log = grid.set(8, 4, 4, 8, contrib.log, {
    border: {
      type: 'line'
    },
    fg: "blue",
    label: 'Log for Miner 2'
  }
)

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

function BlockChain (options) {
  this.difficulty = options.difficulty;
  this.genesisBlock = options.genesisBlock;
  this.blocks = [this.genesisBlock];
  this.logger = options.logger
  this.genesisBlock.print(this.logger)

  this.addNewBlock = function (block) {
    var ourLastBlock = this.blocks[this.blocks.length - 1]

    this.blocks.push(block);
    block.print(this.logger);
  }

  this.replaceChain = function (blocks) {
    this.logger.log('Replacing Chain')
    this.logger.log('=====================')
    this.blocks = blocks;

    var newBlocks = this.blocks.slice(-10)

    for (var i = 0; i < newBlocks.length; i++) {
      var block = newBlocks[i]
      block.print(this.logger);
    }
  }

  this.generateTransaction = function () {
    var names = _.shuffle(['Alice', 'Bob', 'Carol', 'Dave', 'Eric']);
    return names[0] + " paid " + names [1] + " " + Math.floor(Math.random() * 10);
  }

  this.generateTransactions = function () {
    var transactions = '';
    for (var i = 0; i < 3; i++) {
      transactions += this.generateTransaction() + '; '
    }
    return transactions;
  }

  this.blockHeight = function () {
    return this.blocks.length;
  }
}

function Block (options) {
  this.blockNumber = options.blockNumber;
  this.hash = options.hash;
  this.transactions = options.transactions;
  this.owner = options.owner;
  this.color = options.color;

  this.print = function (logger) {
    var numString = String(this.blockNumber);
    while (numString.length < 3) {
      numString = '0' + numString;
    }

    logger.log("{" + this.color + "-fg}     *_______*" + "{/" + this.color + "-fg}");
    logger.log("{" + this.color + "-fg}     |       |" + "{/" + this.color + "-fg}");
    logger.log("{" + this.color + "-fg}     |  " + numString +"  |{/" + this.color + "-fg}");
    logger.log("{" + this.color + "-fg}     |       |" + "{/" + this.color + "-fg}");
    logger.log("{" + this.color + "-fg}     *_______*" + "{/" + this.color + "-fg}");
  }
}

function Miner (options) {
  this.name = options.name;
  this.color = options.color;
  this.power = options.power;
  this.logger = options.logger;
  this.strategy = options.strategy;
  this.blockChain = options.blockChain;
  this.nonce = 0;
  this.otherMiners = options.otherMiners;

  this.run = function () {
    this.logger.log('Initializing ' + this.name)
    this.logger.log('This miner is set to make a mining attempt every ' + this.power + ' milliseconds')

    setInterval(this.strategy.bind(this), this.power)
  }
}


var honestStrategy = function () {
  var theirBlockHeight = 0;
  var otherMiner = this.otherMiners[0];

  this.logger.log('Our BLOCK HIEGHT ' + String(this.blockChain.blocks.length))
  this.logger.log('Thy BLOCK HIEGHT ' + String(otherMiner.blockChain.blocks.length))

  if (otherMiner.blockChain.blocks.length > this.blockChain.blocks.length) {
    var blocks = longestMiner.blockChain.blocks
    this.blockChain.replaceChain(blocks)
  }
  // First thing is to check to see if anyone's bockchain is longer than ours, and update with this if we can't; also reset nonce if that is the case
  var block = this.blockChain.blocks[this.blockChain.blocks.length - 1];


  this.logger.log('Attempting to mining on top of block ' + block.blockNumber);

  this.logger.log('Attempting Nonce ' + this.nonce);

  var transactions = this.blockChain.generateTransactions()
  var blockText = block.hash + transactions + block.nonce;
  var newSha = crypto.createHmac('sha256', blockText).digest('hex').substring(0, 16);

  this.logger.log('Trying Hash: ' + newSha);
  block.nonce += 1

  if (parseInt(newSha, 16) < parseInt(this.blockChain.difficulty, 16) ) {
    this.logger.log('New Block Found!');
    this.logger.log('');

    var newBlock = new Block({
      blockNumber: block.blockNumber + 1,
      hash: newSha,
      transactions: transactions,
      owner: this,
      color: this.color
    });
    this.blockChain.addNewBlock(newBlock)
  }

  screen.render();
}


var genesisBlock = new Block({
  blockNumber: 0,
  hash: 'Genesis Block',
  transactions: 'None',
  color: 'white'
});

miner1 = new Miner({
  color: 'red',
  power: 3000,
  name: 'Miner 1',
  logger: miner1Log,
  strategy: honestStrategy,
  otherMiners: [],
  blockChain: new BlockChain({
    difficulty: "3FFFFFFFFFFFFFFF",
    genesisBlock: genesisBlock,
    logger: blockchain1Log,
  }),
})

miner2 = new Miner({
  color: 'blue',
  power: 10000,
  name: 'Miner 2',
  logger: miner2Log,
  strategy: honestStrategy,
  otherMiners: [],
  blockChain: new BlockChain({
    difficulty: "3FFFFFFFFFFFFFFF",
    genesisBlock: genesisBlock,
    logger: blockchain2Log,
  }),
  logger: miner2Log,
})

miner1.otherMiners = [miner2]
miner2.otherMiners = [miner1]

screen.render()
miner1.run()
miner2.run()

// this.updateTable = function () {
//
//   var miner1Blocks = 0;
//   var miner2Blocks = 0;
//
//   for(var i = 0; i < this.blocks.length; i++) {
//     if (this.blocks[i].owner == this.miners[0]) {
//       miner1Blocks++;
//     } else if (this.blocks[i].owner == this.miners[1]){
//       miner2Blocks++;
//     }
//   }
//
//   if (this.blocks.length > 1) {
//     miningTable.setData({
//       headers: ['Miner', 'Blocks Won', '% Share', 'Runs every X milliseconds'],
//       data: [
//         ["{red-fg}" + this.miners[0].name, miner1Blocks, Math.floor(100 * miner1Blocks / this.blocks.slice(1).length) + '%', this.miners[0].power],
//         ["{blue-fg}" + this.miners[1].name, miner2Blocks, Math.floor(100 * miner2Blocks / this.blocks.slice(1).length) + '%', this.miners[1].power]
//       ]
//     })
//   } else {
//     miningTable.setData({
//       headers: ['Miner', 'Blocks Won', '% Share', 'Runs every X milliseconds'],
//       data: [
//         ["{red-fg}" + this.miners[0].name, String(0), String(0) + "%", this.miners[0].power],
//         ["{blue-fg}" + this.miners[1].name, String(0), String(0) + "%", this.miners[1].power]
//       ]
//     })
//   }
//
//   screen.render();
// }
