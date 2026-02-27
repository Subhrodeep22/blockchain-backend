require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

// -------- Provider & Wallet --------
let provider;
let wallet;
let contract;

if (process.env.RPC_URL && process.env.PRIVATE_KEY) {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

// -------- Load ABI --------
let abi = [];
try {
  abi = require("./abi.json");
} catch (err) {
  abi = [];
}

// -------- Initialize Contract --------
if (wallet && process.env.CONTRACT_ADDRESS && abi.length > 0) {
  contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    wallet
  );
}

// -------- Utility: Hash Function --------
const hashCertificate = (studentName, course) => {
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "string"],
    [studentName, course]
  );
  return ethers.keccak256(encoded);
};

// -------- In-Memory Store --------
let issuedCertificates = [];

// -------- Routes --------

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/certificates", async (req, res) => {
  try {
    const { certId, studentName, course } = req.body;

    if (!certId || !studentName || !course) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (!contract) {
      return res.json({ error: "Contract not configured yet" });
    }

    const hash = hashCertificate(studentName, course);

    const tx = await contract.issueCertificate(certId, hash);
    await tx.wait();

    issuedCertificates.push(certId);

    res.json({
      message: "Certificate Issued",
      txHash: tx.hash
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/certificates/:id", async (req, res) => {
  try {
    if (!contract) {
      return res.json({ error: "Contract not configured yet" });
    }

    const hash = await contract.verifyCertificate(req.params.id);

    res.json({ certId: req.params.id, hash });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/certificates", (req, res) => {
  res.json({ issuedCertificates });
});

// -------- Start Server --------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});