/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {

	constructor() {
		this.bd = new LevelSandbox();
		this.generateGenesisBlock();
	}

	// Auxiliar method to create a Genesis Block (always with height= 0)
	// You have to options, because the method will always execute when you create your blockchain
	// you will need to set this up statically or instead you can verify if the height !== 0 then you
	// will not create the genesis block
	generateGenesisBlock() {
		this.bd.getBlocksCount()
			.then((count) => {
				if (count === 0) {
					this.addBlock(new Block('First block in the chain - Genesis block'));
				}
			});
	}

	// Get block height, it is auxiliar method that return the height of the blockchain
	getBlockHeight() {
		return this.bd.getBlocksCount()
			.then(count => count - 1);
	}

	// Add new block
	async addBlock(newBlock) {
		const self = this;
		const height = await this.getBlockHeight();

		if (height > -1) {
			const previousBlock = await this.getBlock(height);
			newBlock.previousBlockHash = previousBlock.hash;
		}

		newBlock.height = height + 1;
		newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

		return this.bd.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString())
			.then((result) => {
				if (!result) {
					console.log('Error Adding data');
				} else {
					self.chain.push(newBlock);
					console.log(result);
				}
			})
			.catch((err) => {
				console.log(err);
			});
	}

	// Get Block By Height
	getBlock(height) {
		return this.bd.getLevelDBData(height);
	}

	// Validate if Block is being tampered by Block Height
	validateBlock(height) {
		return this.bd.getLevelDBData(height)
			.then((block) => {
				return !block; // the block is only valid if the height is unique
			})
			.catch((err) => {
				return err;
			})
	}

	// Validate Blockchain
	validateChain() {
		// Add your code here
	}

	// Utility Method to Tamper a Block for Test Validation
	// This method is for testing purpose
	_modifyBlock(height, block) {
		let self = this;
		return new Promise((resolve, reject) => {
			self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
				resolve(blockModified);
			}).catch((err) => {
				console.log(err);
				reject(err)
			});
		});
	}

}

module.exports = Blockchain;