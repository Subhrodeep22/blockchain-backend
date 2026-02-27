const { ethers } = require("ethers");
require("dotenv").config();

let provider;
let wallet;

if (process.env.RPC_URL && process.env.PRIVATE_KEY) {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

module.exports = { provider, wallet };