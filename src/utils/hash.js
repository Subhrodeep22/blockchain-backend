const { ethers } = require("ethers");

const hashCertificate = (data) => {
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "string"],
    [data.studentName, data.course]
  );

  return ethers.keccak256(encoded);
};

module.exports = { hashCertificate };