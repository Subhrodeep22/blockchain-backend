const { issueOnBlockchain, verifyOnBlockchain } = require("../services/blockchainService");
const { hashCertificate } = require("../utils/hash");

let issuedCertificates = [];

const issueCertificate = async (req, res, next) => {
  try {
    const { certId, studentName, course } = req.body;

    if (!certId || !studentName || !course) {
      return res.status(400).json({ error: "All fields required" });
    }

    const hash = hashCertificate({ studentName, course });

    const txHash = await issueOnBlockchain(certId, hash);

    issuedCertificates.push(certId);

    res.json({ message: "Issued", txHash });
  } catch (err) {
    next(err);
  }
};

const verifyCertificate = async (req, res, next) => {
  try {
    const certId = req.params.id;

    const hash = await verifyOnBlockchain(certId);

    res.json({ certId, hash });
  } catch (err) {
    next(err);
  }
};

const listCertificates = (req, res) => {
  res.json({ certificates: issuedCertificates });
};

module.exports = {
  issueCertificate,
  verifyCertificate,
  listCertificates
};