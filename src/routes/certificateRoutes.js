const express = require("express");
const {
  issueCertificate,
  verifyCertificate,
  listCertificates
} = require("../controllers/certificateController");

const router = express.Router();

router.post("/certificates", issueCertificate);
router.get("/certificates/:id", verifyCertificate);
router.get("/certificates", listCertificates);

module.exports = router;