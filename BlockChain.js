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

	/**
	 * @description Get block height, it is auxiliar method that return the height of the blockchain
	 * @return {Promise<number>}
	 */
	getBlockHeight() {
		return this.bd.getBlocksCount()
			.then(count => count - 1);
	}

	/**
	 * @description Add new block
	 * @param newBlock
	 * @return {Promise<string>}
	 */
	async addBlock(newBlock) {
		const height = await this.getBlockHeight();

		if (height > -1) {
			const previousBlock = await this.getBlock(height);
			const { hash } = previousBlock;
			newBlock.previousBlockHash = hash;
		}

		newBlock.height = height + 1;
		newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

		return this.bd.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString())
			.then((result) => {
				if (!result) {
					console.log('Error Adding data');
				} else {
					console.log(result);
				}
			})
			.catch((err) => {
				console.log(err);
			});
	}

	/**
	 * @description Get Block By Height
	 * @param height
	 * @return {Promise<Object>}
	 */
	async getBlock(height) {
		const block = await this.bd.getLevelDBData(height);
		return block ? JSON.parse(block) : block;
	}

	/**
	 * @description Validate if Block is being tampered by Block Height
	 * @param height
	 * @return {Promise<boolean>}
	 */
	async validateBlock(height) {
		const { hash, ...block } = await this.getBlock(height); // remove hash from the block
		const validationHash = SHA256(JSON.stringify(block)).toString(); // create the block hash again

		return new Promise((resolve, reject) => {
			const valid = hash === validationHash; // check if the hash and validateHash are the same
			resolve(valid);
		});
	}

	/**
	 * @description Validate Blockchain
	 * @return {Promise<boolean>}
	 */
	validateChain() {
		let self = this;
		return new Promise(function (resolve, reject) {
			self.bd.db.createReadStream()
				.on('data', async function ({ key }) {
					const height = parseInt(key, 10);
					const { previousBlockHash } = await self.getBlock(height);
					const validBlock = self.validateBlock(height); // validate the current block
					let validPreviousBlockHash = true;

					// check if current block previousBlockHash is equal to the previous block hash
					if (previousBlockHash) {
						const previousBlock = await self.getBlock(height - 1);
						validPreviousBlockHash = previousBlock.hash === previousBlockHash;
					}

					// check if some block is invalid
					if (!(validBlock && validPreviousBlockHash)) resolve(false);
				})
				.on('error', function (err) {
					reject(err);
				})
				.on('close', function () {
					resolve(true);
				});
		});
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