import express from "express";
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { nome, mensagem, numero } = req.body;

    if (!nome || !mensagem || !numero) {
      console.warn("❗ Dados incompletos recebidos:", req.body);
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    // Aqui seria o ponto onde você aciona o cliente WhatsApp, se houver.
    console.log(`✅ Disparando mensagem para ${numero} (${nome}): ${mensagem}`);

    // Retorno de sucesso
    return res.json({ sucesso: true, mensagem: "Mensagem enviada com sucesso!" });

  } catch (err) {
    console.error("❌ Erro ao enviar:", err);
    return res.status(500).json({ sucesso: false, erro: "Falha no envio." });
  }
});

export default router;
