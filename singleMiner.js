var blessed = require('blessed'),
    contrib = require('blessed-contrib'),
    crypto = require('crypto'),
    underscore = require('underscore'),
    _ = underscore._

var screen = blessed.screen()

//create layout and widgets

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

screen.title = 'Single Miner Demo';

// Grid.prototype.set = function(row, col, rowSpan, colSpan, obj, opts) {

var minerLog = grid.set(0, 0, 10, 5, contrib.log, {
    border: {
      type: 'line'
    },
    label: 'Miner 1'
  }
)

var systemLog = grid.set(4, 5, 6, 7, contrib.log, {
    border: {
      type: 'line'
    },
    fg: "green",
    label: 'Logs'
  }
)

var statusTable = grid.set(0, 5, 4, 7, contrib.table, {
    border: {
      type: 'line'
    },
    columnSpacing: 10,
    columnWidth: [22, 60],
    fg: 'yellow',
    interactive: false,
    label: 'Status',
  }
)

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

var generateTransaction = function () {
  names = _.shuffle(['Alice', 'Bob', 'Carol', 'Dave', 'Eric']);
  return names[0] + " paid " + names [1] + " " + Math.floor(Math.random() * 10);
}

var generateTransactions = function () {
  transactions = '';
  for (var i = 0; i < 3; i++) {
    transactions += generateTransaction() + '; '
  }
  return transactions;
}

var updateStatusTable = function (data) {
  statusTable
}

function Block(options) {
  this.blockNumber = options.blockNumber;
  this.hash = options.hash;
  this.transactions = options.transactions || generateTransactions();
  this.nonce = 0;

  this.print = function (logger) {
    var numString = String(this.blockNumber);
    while (numString.length < 3) {
      numString = '0' + numString;
    }

    logger.log("             *_______*");
    logger.log("             |       |");
    logger.log("             |  " + numString +"  |" + '            ' + this.hash);
    logger.log("             |       |");
    logger.log("             *_______*");
  }
}

function Miner() {
  var that = this;

  this.genesisBlock = new Block({
    blockNumber: 0,
    hash: 'Genisis Block',
    transactions: ''
  });

  this.difficulty = "3FFFFFFFFFFFFFFF"

  this.blockChain = [this.genesisBlock];

  this.printStatus = function (table, block, options) {
    table.setData({
      headers: ['', ''],
      data:
      [ ["Block Number", block.blockNumber],
        ["Difficulty", this.difficulty],
        ["Current Block Hash", block.hash],
        ["Transactions", block.transactions],
        ["Potential New Hash", options.currentHash],
        ["Nonce", block.nonce]
      ]
    })
  }

  this.run = function () {
    this.genesisBlock.print(minerLog);
    this.printStatus(statusTable, this.genesisBlock,
      {
        currentHash: 'none'
      }
    );
    this.startingBlock = true;

    systemLog.log('Generating Genesis Block')
    systemLog.log('Initializing Miner')

    setInterval(function() {
      var block = that.blockChain[that.blockChain.length - 1];

      if (that.startingBlock == true) {
        systemLog.log('Mining on top of block ' + block.blockNumber);
      }

      that.startingBlock = false;


      systemLog.log('Attempting Nonce ' + block.nonce);
      var blockText = block.hash + block.transactions + block.nonce
      var newSha = crypto.createHmac('sha256', blockText).digest('hex').substring(0, 16);

      that.printStatus(statusTable, block, {
        currentHash: newSha
      })

      systemLog.log('Sha is now ' + newSha);
      block.nonce += 1

      if (parseInt(newSha, 16) < parseInt(that.difficulty, 16) ) {
        systemLog.log('New Block Found!');
        systemLog.log('');

        var newBlock = new Block({
          blockNumber: block.blockNumber + 1,
          hash: newSha,
        });

        that.printStatus(statusTable, newBlock, {
          currentHash: 'none'
        })

        newBlock.print(minerLog);
        that.blockChain.push(newBlock);
        that.startingBlock = true;
      }

      screen.render();
    }, 1000)
  }
}


// Render the screen.
screen.render();
miner = new Miner()
miner.run();
