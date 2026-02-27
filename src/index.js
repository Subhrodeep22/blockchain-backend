/*************************************************
 * CONFIG / PROVIDER
 *************************************************/
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

let provider;
let wallet;
let contract;

if (process.env.RPC_URL && process.env.PRIVATE_KEY) {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

// Load ABI safely
let abi = [];
try {
  abi = require("./abi.json");
} catch (err) {
  abi = [];
}

if (wallet && process.env.CONTRACT_ADDRESS && abi.length > 0) {
  contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    wallet
  );
}

/*************************************************
 * UTILS / HASH
 *************************************************/
const hashCertificate = (studentName, course) => {
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "string"],
    [studentName, course]
  );
  return ethers.keccak256(encoded);
};

/*************************************************
 * IN-MEMORY DATABASE
 *************************************************/
let issuedCertificates = [];

/*************************************************
 * SERVICES / BLOCKCHAIN
 *************************************************/
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

/*************************************************
 * CONTROLLERS
 *************************************************/
const issueCertificate = async (req, res, next) => {
  try {
    const { certId, studentName, course } = req.body;

    // Basic Validation
    if (!certId || !studentName || !course) {
      return res.status(400).json({
        error: "certId, studentName and course are required"
      });
    }

    // Prevent duplicate IDs
    if (issuedCertificates.includes(certId)) {
      return res.status(400).json({
        error: "Certificate ID already issued"
      });
    }

    const hash = hashCertificate(studentName, course);
    const txHash = await issueOnBlockchain(certId, hash);

    issuedCertificates.push(certId);

    res.json({
      message: "Certificate Issued Successfully",
      txHash
    });

  } catch (err) {
    next(err);
  }
};

const verifyCertificate = async (req, res, next) => {
  try {
    const certId = req.params.id;

    if (!certId) {
      return res.status(400).json({ error: "certId required" });
    }

    const hash = await verifyOnBlockchain(certId);

    res.json({
      certId,
      hash
    });

  } catch (err) {
    next(err);
  }
};

const listCertificates = (req, res) => {
  res.json({
    total: issuedCertificates.length,
    certificates: issuedCertificates
  });
};

/*************************************************
 * ROUTES
 *************************************************/
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/api/certificates", issueCertificate);
app.get("/api/certificates/:id", verifyCertificate);
app.get("/api/certificates", listCertificates);

/*************************************************
 * ERROR HANDLER (Middleware)
 *************************************************/
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    error: err.message || "Internal Server Error"
  });
});

/*************************************************
 * SERVER START
 *************************************************/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});