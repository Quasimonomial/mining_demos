var blessed = require('blessed'),
    contrib = require('blessed-contrib'),
    crypto = require('crypto'),
    underscore = require('underscore'),
    _ = underscore._


var screen = blessed.screen()

//create layout and widgets

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

screen.title = 'Two Fair Miners';

// Grid.prototype.set = function(row, col, rowSpan, colSpan, obj, opts) {
var blockchainLog = grid.set(0, 0, 12, 4, contrib.log, {
    border: {
      type: 'line'
    },
    label: 'BlockChain',
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

function BlockChain (options) {
  this.difficulty = options.difficulty;
  this.genesisBlock = new Block({
    blockNumber: 0,
    hash: 'Genesis Block',
    transactions: 'None',
    owner: this
  });

  this.blocks = [this.genesisBlock];
  this.name = "BlockChain";
  this.color = 'white';

  this.genesisBlock.print()

  this.addNewBlock = function (block) {
    ourLastBlock = this.blocks[this.blocks.length - 1]

    if (ourLastBlock.blockNumber != block.blockNumber - 1) {
      // reject blocks with bad block number, in real life we inspect the sha as well as other things
      return false
    }

    this.blocks.push(block);
    block.print();
    this.updateTable();
  }

  this.generateTransaction = function () {
    names = _.shuffle(['Alice', 'Bob', 'Carol', 'Dave', 'Eric']);
    return names[0] + " paid " + names [1] + " " + Math.floor(Math.random() * 10);
  }

  this.generateTransactions = function () {
    transactions = '';
    for (var i = 0; i < 3; i++) {
      transactions += this.generateTransaction() + '; '
    }
    return transactions;
  }


  this.updateTable = function () {

    var miner1Blocks = 0;
    var miner2Blocks = 0;

    for(var i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].owner == this.miners[0]) {
        miner1Blocks++;
      } else if (this.blocks[i].owner == this.miners[1]){
        miner2Blocks++;
      }
    }

    if (this.blocks.length > 1) {
      miningTable.setData({
        headers: ['Miner', 'Blocks Won', '% Share', 'Runs every X milliseconds'],
        data: [
          ["{red-fg}" + this.miners[0].name, miner1Blocks, Math.floor(100 * miner1Blocks / this.blocks.slice(1).length) + '%', this.miners[0].power],
          ["{blue-fg}" + this.miners[1].name, miner2Blocks, Math.floor(100 * miner2Blocks / this.blocks.slice(1).length) + '%', this.miners[1].power]
        ]
      })
    } else {
      miningTable.setData({
        headers: ['Miner', 'Blocks Won', '% Share', 'Runs every X milliseconds'],
        data: [
          ["{red-fg}" + this.miners[0].name, String(0), String(0) + "%", this.miners[0].power],
          ["{blue-fg}" + this.miners[1].name, String(0), String(0) + "%", this.miners[1].power]
        ]
      })
    }

    screen.render();
  }
}

function Block (options) {
  this.blockNumber = options.blockNumber;
  this.hash = options.hash;
  this.transactions = options.transactions;
  this.owner = options.owner;

  this.print = function () {
    var numString = String(this.blockNumber);
    while (numString.length < 3) {
      numString = '0' + numString;
    }
    var color = this.owner.color;

    blockchainLog.log("{" + color + "-fg}             *_______*" + "{/" + color + "-fg}");
    blockchainLog.log("{" + color + "-fg}             |       |" + "{/" + color + "-fg}");
    blockchainLog.log("{" + color + "-fg}             |  " + numString +"  |" + '            ' + this.owner.name) + "{/" + color + "-fg}";
    blockchainLog.log("{" + color + "-fg}             |       |" + "{/" + color + "-fg}");
    blockchainLog.log("{" + color + "-fg}             *_______*" + "{/" + color + "-fg}");
  }
}

function Miner (options) {
  var that = this;
  this.name = options.name;
  this.color = options.color;
  this.power = options.power;
  this.logger = options.logger;

  this.blockChain = options.blockChain;

  this.lastBlock = that.blockChain.genesisBlock;
  this.nonce = 0;
  // Miner is responsible for trying Nonces at Random

  this.run = function () {
    this.logger.log('Initializing ' + this.name)
    this.logger.log('This miner is set to make a mining attempt every ' + this.power + ' milliseconds')

    this.startingBlock = true;

    setInterval(function () {
      var block = that.blockChain.blocks[that.blockChain.blocks.length - 1];

      if (block != that.lastBlock) {
        that.logger.log('Block from opposing miner found, updating internal chain');
        that.nonce = 0
      }

      that.logger.log('Attempting to mining on top of block ' + block.blockNumber);

      that.logger.log('Attempting Nonce ' + that.nonce);

      var transactions = blockChain.generateTransactions()
      var blockText = block.hash + transactions + block.nonce;
      var newSha = crypto.createHmac('sha256', blockText).digest('hex').substring(0, 16);

      that.logger.log('Trying Hash: ' + newSha);
      block.nonce += 1

      if (parseInt(newSha, 16) < parseInt(that.blockChain.difficulty, 16) ) {
        that.logger.log('New Block Found!');
        that.logger.log('');

        var newBlock = new Block({
          blockNumber: block.blockNumber + 1,
          hash: newSha,
          transactions: transactions,
          owner: that
        });

        if (that.blockChain.addNewBlock(newBlock)) {
          that.logger.log('Block added to chain successfully!');
        } else {
          that.logger.log('Someone else beat us to it!');
        }
      }

      screen.render();
    }, this.power)
  }
}

screen.render();
blockChain = new BlockChain({
  difficulty: "3FFFFFFFFFFFFFFF"
});

miner1 = new Miner({
  color: 'red',
  power: 250,
  name: 'Miner 1',
  logger: miner1Log,
  blockChain: blockChain
})
miner2 = new Miner({
  color: 'blue',
  power: 500,
  name: 'Miner 2',
  logger: miner2Log,
  blockChain: blockChain
})

blockChain.miners = [miner1, miner2]
blockChain.updateTable();
miner1.run()
miner2.run()
