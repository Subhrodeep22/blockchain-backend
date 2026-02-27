const { wallet } = require("../config/provider");
const abi = require("../../abi.json");
require("dotenv").config();
const { ethers } = require("ethers");

let contract;

if (wallet && process.env.CONTRACT_ADDRESS && abi.length > 0) {
  contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    wallet
  );
}

const issueOnBlockchain = async (certId, hash) => {
  if (!contract) throw new Error("Contract not configured yet");
  const tx = await contract.issueCertificate(certId, hash);
  await tx.wait();
  return tx.hash;
};

const verifyOnBlockchain = async (certId) => {
  if (!contract) throw new Error("Contract not configured yet");
  return await contract.verifyCertificate(certId);
};

module.exports = { issueOnBlockchain, verifyOnBlockchain };