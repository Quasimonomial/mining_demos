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
    columnWidth: [24, 10, 10, 10, 40],
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

  this.getStats = function () {
    var myBlocks = 0;
    var theirBlocks = 0;

    for(var i = 0; i < this.blockChain.length; i++) {
      if (this.blockChain.blocks[i].owner == this) {
        miner1Blocks++;
      } else if (this.blockChain.blocks[i].owner == this.otherMiners[0]){
        miner2Blocks++;
      }
    }

    var totalBlocks = myBlocks + theirBlocks;
    var myPercentBlocks = totalBlocks === 0 ? 0 : Math.floor(100 * myBlocks / totalBlocks)
    var thyPercentBlocks = totalBlocks === 0 ? 0 : Math.floor(100 * theirBlocks / totalBlocks)

    return {
      name: String(this.name),
      myBlocks: String(myBlocks),
      theirBlocks: String(theirBlocks),
      myPercentBlocks: String(myPercentBlocks),
      theirPercentBlocks: String(thyPercentBlocks),
      totalBlocks: String(totalBlocks)
    }
  }
}


var honestStrategy = function () {
  var theirBlockHeight = 0;
  var longestMiner = null;

  for(var i = 0; i < this.otherMiners.length; i++) {
    if (this.otherMiners[i].blockChain.blocks.length > theirBlockHeight) {
      longestMiner = this.otherMiners[i];
      theirBlockHeight = this.otherMiners[i].blockChain.blocks.length;
    }
  }

  this.logger.log('BLOCK HIEGHT ' + String(this.blockChain.blocks.length))

  if (theirBlockHeight > this.blockChain.blocks.length) {
    var blocks = longestMiner.blockChain.blocks.map(a => Object.assign({}, a));
    this.blockChain.replaceChain(blocks)
  }
  // First thing is to check to see if anyone's bockchain is longer than ours, and update with this if we can't; also reset nonce if that is the case
  var block = this.blockChain.blocks[this.blockChain.blocks.length - 1];


  this.logger.log('Attempting to mining on top of block ' + block.blockNumber);

  // this.logger.log('Attempting Nonce ' + this.nonce);

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
  updateTable();
}


var genesisBlock = new Block({
  blockNumber: 0,
  hash: 'Genesis Block',
  transactions: 'None',
  color: 'white'
});

miner1 = new Miner({
  color: 'red',
  power: 1000,
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
  power: 3000,
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



// return {
//   name: this.name,
//   myBlocks: myBlocks,
//   theirBlocks: theirBlocks,
//   myPercentBlocks: myPercentBlocks,
//   thyPercentBlocks: thyPercentBlocks,
//   totalBlocks: totalBlocks
// }
var updateTable = function () {
  var miner1Data = miner1.getStats();
  var miner2Data = miner2.getStats();

  miningTable.setData({
    headers: ['Miner', 'Blocks Won', 'Total Blocks', '% Share', 'Runs every X milliseconds'],
    data: [
      ["{red-fg}Miner 1 Sees:"],
      [miner1Data.name, miner1Data.myBlocks, miner1Data.totalBlocks, miner1Data.myPercentBlocks, String(miner1.power)],
      [miner2.name, miner1Data.theirBlocks, miner1Data.totalBlocks, miner1Data.theirPercentBlocks, String(miner2.power)],
      [],
      [],
      ["{blue-fg}Miner 2 Sees:"],
      [miner1Data.name, miner1Data.theirBlocks, miner1Data.totalBlocks, miner1Data.theirPercentBlocks, String(miner1.power)],
      [miner2.name, miner1Data.myBlocks, miner1Data.totalBlocks, miner1Data.myPercentBlocks, String(miner2.power)],
    ]
  })

  screen.render();
}

updateTable()
