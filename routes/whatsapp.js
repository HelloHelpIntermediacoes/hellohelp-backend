const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Rota para servir o QR Code
router.get("/qrcode-disparador", (req, res) => {
  const qrPath = path.join(__dirname, "..", "midia", "qrcode.png");

  if (fs.existsSync(qrPath)) {
    const base64Image = fs.readFileSync(qrPath, { encoding: "base64" });
    const imageDataUrl = `data:image/png;base64,${base64Image}`;
    res.json({ qr: imageDataUrl });
  } else {
    res.status(404).json({ erro: "QR Code não encontrado" });
  }
});

module.exports = router;
