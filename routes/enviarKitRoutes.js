// src/routes/enviarKitRoutes.js
import express from "express";
import sgMail from "@sendgrid/mail";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "../firebase/firebaseAdmin.js";

dotenv.config();

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Configuração do SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ Firestore (Banco de dados)
const db = admin.firestore();

// ✅ Função para gerar o PDF de Boas-Vindas
function gerarPDF(usuario, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc
      .fontSize(20)
      .fillColor("#4f46e5")
      .text("🎓 Kit de Boas-Vindas – Hello Help", { align: "center" })
      .moveDown();

    doc
      .fontSize(12)
      .fillColor("black")
      .text(`👤 Nome: ${usuario.nome || "Não informado"}`)
      .text(`📧 Email: ${usuario.email || "Não informado"}`)
      .text(`🔐 Tipo de Perfil: ${usuario.tipo || "Não informado"}`)
      .text(`🆔 ID: ${usuario.id || usuario.uid || "Não informado"}`)
      .moveDown();

    doc
      .text("🎯 Bem-vindo(a) à Hello Help!")
      .text("Aqui você encontrará oportunidades reais de crescimento pessoal, profissional e financeiro.")
      .moveDown();

    doc
      .text("📌 Ações recomendadas:")
      .list([
        "1. Acesse seu painel na plataforma",
        "2. Complete seu perfil e envie seu vídeo de verificação",
        "3. Fale com seu consultor Hello Help",
        "4. Explore as trilhas formativas e oportunidades",
      ])
      .moveDown();

    doc.text("📞 Dúvidas? Estamos à disposição no chat da plataforma.");
    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

// ✅ Rota para envio do Kit
router.post("/", async (req, res) => {
  const { usuario } = req.body;

  if (!usuario || !usuario.email || !usuario.nome || !(usuario.id || usuario.uid)) {
    console.error("❌ Erro: Dados do usuário incompletos.", usuario);
    return res.status(400).json({ success: false, message: "❌ Dados do usuário incompletos." });
  }

  const userId = usuario.id || usuario.uid;
  const nomeArquivo = `Kit_HelloHelp_${userId}.pdf`.replace(/[^\w.-]/g, "_");
  const pdfPath = path.join(__dirname, "..", "banco", nomeArquivo);

  try {
    // 📄 Gera o PDF
    await gerarPDF(usuario, pdfPath);

    // ✉️ Monta o e-mail
    const msg = {
      to: usuario.email,
      from: "contatohellohelp@gmail.com",
      subject: "🎁 Seu Kit de Boas-Vindas - Hello Help",
      html: `
        <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:10px;">
          <div style="background:#f9f9ff; padding:20px; text-align:center;">
            <img src="https://hellohelp.com.br/logo.png" alt="Hello Help" style="max-height:60px;" />
            <h2 style="color:#4f46e5;">🎁 KIT ESTRATÉGICO DISPONÍVEL</h2>
            <p>Olá <strong>${usuario.nome}</strong>, seja bem-vindo(a) à Hello Help!</p>
          </div>
          <div style="padding: 20px;">
            <p>Seu consultor está disponível para iniciar sua jornada.</p>
            <ul>
              <li>🔍 Avaliação personalizada</li>
              <li>📈 Estratégias de crescimento</li>
              <li>📚 Acesso à educação complementar</li>
            </ul>
            <div style="text-align:center; margin:20px 0;">
              <a href="https://hellohelp.com.br/Conversas" style="background:#4f46e5; color:white; padding:12px 24px; border-radius:6px; text-decoration:none;">
                👉 FALAR COM CONSULTOR
              </a>
            </div>
            <p style="font-size:13px; color:#999;">* O PDF está anexado a este e-mail.</p>
          </div>
          <div style="background:#eee; text-align:center; padding:10px; font-size:12px; color:#777;">
            Hello Help • Transformando habilidades em oportunidades reais • hellohelp.com.br
          </div>
        </div>
      `,
      attachments: [
        {
          content: fs.readFileSync(pdfPath).toString("base64"),
          filename: `Kit_HelloHelp_${usuario.nome.replace(/\s/g, "_")}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    // 🚀 Envia o e-mail
    await sgMail.send(msg);

    // ✅ Atualiza status no Firestore
    await db.collection("usuariosHelloHelp").doc(userId).update({
      statusKit: "enviado",
      kitEnviadoEm: new Date().toISOString(),
      mensagemInicial: `Olá ${usuario.nome}, seu consultor está disponível para te orientar. Deseja começar agora?`,
    });

    console.log(`✅ Kit enviado com sucesso para ${usuario.nome} (${usuario.email})`);

    // 🧹 Deleta o PDF após o envio para limpar o servidor
    fs.unlink(pdfPath, (err) => {
      if (err) {
        console.warn("⚠️ Não foi possível deletar o PDF temporário:", err);
      } else {
        console.log("🗑️ PDF temporário deletado com sucesso.");
      }
    });

    return res.status(200).json({ success: true, message: "Kit enviado com sucesso!" });

  } catch (error) {
    console.error("❌ Erro geral ao enviar kit:", error);

    // 🧹 Se der erro, tenta apagar o PDF também
    fs.unlink(pdfPath, (err) => {
      if (err) console.warn("⚠️ Falha ao tentar apagar PDF depois de erro:", err);
    });

    return res.status(500).json({
      success: false,
      message: `Erro ao enviar o kit: ${error.message || error.toString()}`,
    });
  }
});

export default router;
