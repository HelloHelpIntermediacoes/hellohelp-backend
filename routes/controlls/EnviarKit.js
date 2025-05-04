// src/controllers/enviarKit.js

import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "../firebase/firebaseAdmin.js";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Função para gerar o PDF de boas-vindas
const gerarPDF = (usuario) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const nomeArquivo = `Kit_HelloHelp_${usuario.nome.replace(/\s+/g, "_")}.pdf`;
    const caminho = path.join(__dirname, "..", "kits", nomeArquivo);

    // Garante que a pasta "kits" existe
    if (!fs.existsSync(path.dirname(caminho))) {
      fs.mkdirSync(path.dirname(caminho), { recursive: true });
    }

    const stream = fs.createWriteStream(caminho);

    doc.pipe(stream);

    doc
      .fontSize(22)
      .fillColor("#4F46E5")
      .text("🎁 Kit Estratégico de Boas-Vindas – Hello Help", { align: "center" })
      .moveDown(2);

    doc
      .fontSize(14)
      .fillColor("black")
      .text(`👤 Nome: ${usuario.nome}`)
      .text(`📧 Email: ${usuario.email}`)
      .text(`🔖 Tipo de Perfil: ${usuario.tipo || "Não informado"}`)
      .text(`🆔 ID: ${usuario.id}`)
      .moveDown();

    doc
      .fontSize(12)
      .text("A partir de agora, você faz parte da Hello Help — uma plataforma que transforma habilidades em oportunidades reais.")
      .moveDown()
      .list([
        "✅ Acesso ao seu consultor Hello Help especializado",
        "✅ Direcionamento estratégico baseado no seu perfil",
        "✅ Conexão com oportunidades reais na sua área de interesse"
      ])
      .moveDown()
      .text("🚀 Comece agora acessando sua conta e conversando com seu consultor.")
      .moveDown()
      .text("Bem-vindo(a) à Hello Help!", { align: "center" });

    doc.end();

    stream.on("finish", () => {
      const CLIENT_URL = process.env.CLIENT_URL?.replace(/\/$/, "") || "http://localhost:5173";
      const url = `${CLIENT_URL}/kits/${nomeArquivo}`;
      resolve({ url, caminho });
    });

    stream.on("error", (err) => {
      console.error("❌ Erro ao gerar PDF:", err);
      reject(err);
    });
  });
};

// ✅ Função principal para envio do kit
export const enviarKit = async (req, res) => {
  try {
    const { usuario, nomeConsultor = "Consultor Hello Help", linkConversa = `${process.env.CLIENT_URL}/Conversas` } = req.body;

    // Validação dos campos obrigatórios
    if (!usuario || !usuario.email || !usuario.nome || !usuario.id) {
      return res.status(400).json({ success: false, message: "Dados do usuário incompletos." });
    }

    // Gera o PDF do kit
    const { url: linkPdf } = await gerarPDF(usuario);

    // Monta o e-mail com o link do PDF
    const msg = {
      to: usuario.email,
      from: "contato@hellohelp.com.br",
      subject: `🎁 Olá ${usuario.nome}, seu Kit Estratégico da Hello Help chegou!`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 620px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #f0f4ff; text-align: center; padding: 30px 20px;">
            <h1 style="color: #4F46E5; font-size: 22px;">🎁 Seu Kit Estratégico chegou!</h1>
            <p>Olá <strong>${usuario.nome}</strong>, você está prestes a transformar sua realidade com a Hello Help.</p>
          </div>
          <div style="padding: 25px 30px; color: #333; font-size: 15px;">
            <p><strong>🧭 O que você encontra no Kit:</strong></p>
            <ul>
              <li>✅ Plano prático baseado no seu perfil</li>
              <li>✅ Estratégias para gerar renda com seus talentos</li>
              <li>✅ Dicas práticas e oportunidades reais</li>
              <li>✅ Contato direto com um consultor Hello Help</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkPdf}" style="background-color: #4F46E5; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
                📄 Acessar meu Kit
              </a>
            </div>
            <hr style="margin: 30px 0;" />
            <h3 style="color: #10B981;">💬 Converse com seu consultor</h3>
            <div style="text-align: center;">
              <a href="${linkConversa}" style="background-color: #10B981; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
                Falar com Consultor
              </a>
            </div>
            <p style="font-size: 13px; color: #666; margin-top: 20px; text-align: center;">
              Bem-vindo(a) à Hello Help! Estamos prontos para te apoiar 🚀
            </p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);

    // Atualiza Firestore com status de envio
    await admin.firestore().collection("usuariosHelloHelp").doc(usuario.id).update({
      statusKit: "enviado",
      mensagemInicial: `Olá ${usuario.nome}, seu consultor está disponível para te orientar. Deseja começar agora?`
    });

    console.log(`✅ Kit enviado com sucesso para ${usuario.email}`);
    return res.status(200).json({ success: true, message: "Kit enviado com sucesso!" });

  } catch (error) {
    console.error("❌ Erro ao gerar ou enviar kit:", error?.response?.body || error.message || error);
    return res.status(500).json({ success: false, message: "Erro ao enviar o Kit." });
  }
};
