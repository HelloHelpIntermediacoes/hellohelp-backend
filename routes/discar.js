import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Caminho da pasta onde o Asterisk busca os arquivos .call
const DESTINO_CALL = "/var/spool/asterisk/outgoing";

router.post("/discar", async (req, res) => {
  const { numeros = [] } = req.body;

  if (!Array.isArray(numeros) || numeros.length === 0) {
    return res.status(400).json({ erro: "Lista de números ausente ou inválida." });
  }

  try {
    numeros.forEach((numero) => {
      const nomeArquivo = `${Date.now()}_${numero}.call`;
      const conteudo = `
Channel: SIP/2001
CallerID: HelloHelp <2001>
MaxRetries: 1
RetryTime: 60
WaitTime: 30
Context: from-internal
Extension: ${numero}
Priority: 1
`;

      const tempPath = path.join("/tmp", nomeArquivo);
      const finalPath = path.join(DESTINO_CALL, nomeArquivo);

      // Escreve temporariamente
      fs.writeFileSync(tempPath, conteudo.trim());

      // Move para o diretório do Asterisk
      fs.renameSync(tempPath, finalPath);
    });

    return res.json({ sucesso: true, total: numeros.length });
  } catch (err) {
    console.error("❌ Erro ao gerar chamadas:", err);
    return res.status(500).json({ erro: "Erro ao criar arquivos de chamada." });
  }
});

export default router;
