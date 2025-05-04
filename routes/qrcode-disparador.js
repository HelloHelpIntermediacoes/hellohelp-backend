import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📌 Caminho do QR Code
const caminhoQRCode = path.join(__dirname, "../midia/qrcode.png");

// ✅ Rota que retorna o QR Code salvo
router.get("/qrcode-disparador", (req, res) => {
  try {
    // Verifica se o arquivo existe
    if (!fs.existsSync(caminhoQRCode)) {
      console.warn("⚠️ QR Code não encontrado:", caminhoQRCode);
      return res.status(404).send("QR Code não disponível.");
    }

    // Envia o arquivo se existir
    res.sendFile(caminhoQRCode, (err) => {
      if (err) {
        console.error("❌ Erro ao enviar QR Code:", err.message);
        res.status(500).send("Erro ao carregar QR Code.");
      }
    });
  } catch (error) {
    console.error("❌ Erro geral ao buscar QR Code:", error.message);
    res.status(500).send("Erro interno ao buscar QR Code.");
  }
});

export default router;
