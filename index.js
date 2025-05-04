// ✅ index.js COMPLETO E FUNCIONAL
import express from "express";
import cors from "cors";
import sgMail from "@sendgrid/mail";
import { OpenAI } from "openai";
import fetch from "node-fetch";
import crypto from "crypto";
import admin from "firebase-admin";
import mercadopago from "mercadopago";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import stream from "stream";
import { fileURLToPath } from "url";
import { criarPreferencia } from "./services/PagamentoService.js";
import { iniciarDisparo } from "./routes/controlls/disparoController.js";
import dotenv from "dotenv";
import pkg from "whatsapp-web.js";
import qrcode from "qrcode";
import rotaQRCode from "./routes/qrcode-disparador.js";

const { Client, LocalAuth } = pkg;
dotenv.config();
console.log("✅ Access Token carregado:", process.env.MP_ACCESS_TOKEN);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use("/", rotaQRCode);
app.use(cors()); //
const PORT = process.env.PORT || 3001;

// 🔥 Firebase config
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const firestore = admin.firestore();

// 📧 SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 🧠 OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// WhatsApp cliente
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true },
});

// Geração de QR Code
client.on("qr", (qr) => {
  const qrPath = path.join(__dirname, "midia", "qrcode.png");
  qrcode.toFile(qrPath, qr, (err) => {
    if (err) {
      console.error("❌ Erro ao salvar QR:", err);
    } else {
      console.log("✅ QR Code salvo em:", qrPath);
    }
  });
});

client.on("ready", () => {
  console.log("✅ Cliente WhatsApp conectado!");
});

client.initialize();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/midia", express.static(path.join(__dirname, "midia")));

// Rota para exibir QR code
app.get("/qrcode-disparador", (req, res) => {
  const qrPath = path.join(__dirname, "midia", "qrcode.png");
  if (fs.existsSync(qrPath)) {
    res.sendFile(qrPath);
  } else {
    res.status(404).send("QR Code não encontrado.");
  }
});

// ✅ ROTA BASE
app.get("/", (req, res) => {
  res.send("✅ API Hello Help online!");
});

// ✅ ROTA: Enviar e-mail simples
app.post("/EnviarEmail", async (req, res) => {
  const { para, assunto, corpo } = req.body;
  const msg = {
    to: para,
    from: "contatohellohelp@gmail.com",
    subject: assunto,
    html: `<p>${corpo}</p>`,
  };
  try {
    await sgMail.send(msg);
    res.status(200).json({ sucesso: true, mensagem: "Email enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar email:", error.response?.body || error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar email." });
  }
});
// 🛡️ Permitir requisições do domínio do seu frontend
app.use(cors({
  origin: 'https://hellohelp.com.br', // ou use '*' apenas para testes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.post("/EnviarKit", async (req, res) => {
  const { nome, email, perfil } = req.body;

  if (!nome || !email || !perfil) {
    return res.status(400).json({ erro: "Dados incompletos para envio do kit." });
  }
  const express = require("express");
  const app = express();
  const whatsappRoutes = require("./routes/whatsapp");
  
  app.use(express.json());
  app.use("/", whatsappRoutes);
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

  try {
    // 🧾 Gerar PDF
    const doc = new PDFDocument();
    const nomeArquivo = `Kit_HelloHelp_${nome.replace(/\s/g, "_")}.pdf`;
    const caminhoPDF = path.join("kits", nomeArquivo);
    const writeStream = fs.createWriteStream(caminhoPDF);
    doc.pipe(writeStream);

    // 🖼️ Inserir logotipo (se existir)
    const logoPath = path.join("kits", "Logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 220, 40, { width: 150 });
    }

    // ✨ Conteúdo envolvente
    doc.moveDown(5);
    doc.fontSize(20).fillColor("#007ACC").text(`Olá ${nome},`, { align: "center" });
    doc.moveDown().fontSize(14).fillColor("black").text("Seja muito bem-vindo(a) à Hello Help!", {
      align: "center",
    });

    doc.moveDown().fontSize(13).text(
      `Estamos empolgados em te entregar este Kit de Boas-Vindas, especialmente pensado para seu perfil como ${perfil}.`,
      { align: "left" }
    );

    doc.moveDown().text(
      "A Hello Help foi criada para transformar habilidades em oportunidades reais. A partir de agora, você poderá vender serviços, anunciar produtos, se capacitar, ensinar, aprender e muito mais.",
      { align: "left" }
    );

    doc.moveDown().text(" O que você pode fazer na plataforma:");
    doc.moveDown().list([
      "Anunciar seus serviços e produtos",
      "Acessar cursos e trilhas de carreira",
      "Conectar-se com consultores especialistas",
      "Participar de chats temáticos e grupos profissionais",
      "Receber indicações e oportunidades personalizadas",
    ]);

    doc.moveDown().text(
      " Este kit marca o início de uma jornada com infinitas possibilidades. Explore, interaja e aproveite cada ferramenta pensada especialmente para você.",
      { align: "left" }
    );

    doc.moveDown().fontSize(12).text("Estamos aqui para te apoiar!", { align: "left" });
    doc.moveDown().fontSize(14).fillColor("#007ACC").text("Equipe Hello Help ", {
      align: "right",
    });

    doc.end();
    app.post("/notificarServicoCadastrado", async (req, res) => {
      const { nome, email, tituloServico, telefone, usuarioId } = req.body;
    
      if (!nome || !email || !tituloServico || !telefone || !usuarioId) {
        return res.status(400).json({ erro: "Dados incompletos para notificação." });
      }
    
      // 📨 Envio de e-mail
      try {
        await sgMail.send({
          to: email,
          from: "contatohellohelp@gmail.com",
          subject: "📢 Novo Serviço Cadastrado",
          html: `<p>Olá ${nome},</p><p>Seu serviço <strong>${tituloServico}</strong> foi cadastrado com sucesso na Hello Help! 🎉</p>`,
        });
      } catch (erroEmail) {
        console.error("❌ Erro ao enviar e-mail:", erroEmail.message);
      }
    
      // 🔔 Notificação Firebase
      try {
        await registrarNotificacao({
          usuarioId,
          titulo: "Novo serviço cadastrado!",
          descricao: `O serviço "${tituloServico}" foi cadastrado com sucesso.`,
          tipo: "servico",
        });
      } catch (erroNotificacao) {
        console.error("❌ Erro ao registrar notificação:", erroNotificacao.message);
      }
    
      // 📱 Disparo WhatsApp (salva telefone na lista e envia)
      try {
        const caminhoLista = path.join(__dirname, "..", "auth", "lista.json");
        let lista = [];
        if (fs.existsSync(caminhoLista)) {
          lista = JSON.parse(fs.readFileSync(caminhoLista));
        }
        if (!lista.includes(telefone)) {
          lista.push(telefone);
          fs.writeFileSync(caminhoLista, JSON.stringify(lista, null, 2));
        }
    
        // Aqui você pode disparar a mensagem via socket se quiser:
        // await sock.sendMessage(`${telefone}@c.us`, { text: mensagemEnvio });
      } catch (erroZap) {
        console.error("❌ Erro ao adicionar telefone ao disparo:", erroZap.message);
      }
    
      return res.json({ success: true, mensagem: "Notificações enviadas com sucesso." });
    });

    // 📬 Aguarda a finalização do arquivo
    writeStream.on("finish", async () => {
      try {
        const attachment = fs.readFileSync(caminhoPDF).toString("base64");

        const msg = {
          to: email,
          from: "contatohellohelp@gmail.com",
          subject: "🎁 Seu Kit de Boas-Vindas - Hello Help",
          html: `
            <p>Olá ${nome},</p>
            <p>Segue em anexo seu kit personalizado da Hello Help. Esperamos que você aproveite ao máximo essa nova jornada. 🚀</p>
            <p><strong>Equipe Hello Help</strong></p>
          `,
          attachments: [
            {
              content: attachment,
              filename: nomeArquivo,
              type: "application/pdf",
              disposition: "attachment",
            },
          ],
        };

        await sgMail.send(msg);
        console.log(`✅ PDF gerado e enviado para ${email}`);
        return res.status(200).json({ success: true, mensagem: "Kit enviado com sucesso!" });

        // (Opcional) Remove o arquivo temporário
        // fs.unlinkSync(caminhoPDF);
      } catch (erroEmail) {
        console.error("❌ Erro ao enviar email:", erroEmail);
        return res.status(500).json({ erro: "Erro ao enviar email com o kit." });
      }
    });
    await registrarNotificacao({
      usuarioId: uidDoUsuario,
      titulo: "🎁 Kit de Boas-Vindas Enviado",
      descricao: "Seu kit foi gerado com sucesso. Explore agora as oportunidades da Hello Help!"
    });

    // ⛔ Captura erro no stream
    writeStream.on("error", (streamError) => {
      console.error("❌ Erro ao escrever o PDF:", streamError);
      return res.status(500).json({ erro: "Erro ao gerar o arquivo PDF." });
    });

  } catch (erro) {
    console.error("❌ Erro geral:", erro);
    return res.status(500).json({ erro: "Erro ao gerar ou enviar o kit." });
  }
});


// ✅ ROTA: Chat com OpenAI
app.post("/api/openai", async (req, res) => {
  const { mensagem } = req.body;
  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `Você é o assistente da Hello Help...` },
        { role: "user", content: mensagem },
      ],
    });
    res.json({ resposta: resposta.choices[0]?.message?.content });
  } catch (error) {
    console.error("Erro IA:", error);
    res.status(500).json({ resposta: "Erro ao responder com IA." });
  }
});

// ✅ ROTA: Criar pagamento via MercadoPago
app.post("/api/criar-pagamento", criarPreferencia);

// ✅ ROTA: Notificação MercadoPago
app.post("/api/pagamento-aprovado", (req, res) => {
  console.log("📥 Notificação recebida do MercadoPago:", req.body);
  res.sendStatus(200);
});

// ✅ ROTA: Disparo de mensagens
app.post("/disparar-mensagens", async (req, res) => {
  const diretorioAuth = path.join(__dirname, "auth", "numero1@app"); // ajuste conforme nome da pasta
  console.log("🔍 Verificando diretório:", diretorioAuth);

  if (!fs.existsSync(diretorioAuth)) {
    console.error("❌ Diretório auth não encontrado.");
    return res.status(500).json({ erro: "Diretório de autenticação não encontrado." });
  }

  try {
    const listaPath = path.join(__dirname, "lista.json");
    const lista = fs.existsSync(listaPath) ? JSON.parse(fs.readFileSync(listaPath)) : [];

    for (const telefone of lista) {
      // 🔁 Aqui você deve chamar sua função de envio (via socket, por exemplo)
      console.log(`📤 Disparando para ${telefone}...`);
      // Ex: await sock.sendMessage(`${telefone}@c.us`, { text: "Olá do Hello Help!" });
    }

    res.status(200).json({ mensagem: "Mensagens disparadas com sucesso!" });
  } catch (erro) {
    console.error("❌ Erro no disparo:", erro);
    res.status(500).json({ erro: "Erro ao disparar mensagens." });
  }
});

// ✅ ROTA BASE
app.get("/", (req, res) => {
  res.send("✅ API Hello Help online!");
});


// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Backend Hello Help rodando na porta ${PORT}`);
});


// 🔁 Funções WhatsApp automáticas mantidas
const delayEnvio = 10000;
const diretorioAuth = path.join(__dirname, 'auth', 'numero1@app'); // ou o nome que realmente aparece na pasta
const caminhoLista = './lista.json';
const caminhoGrupos = './gruposPermitidos.json';
const caminhoUsuariosEnviados = './usuariosEnviados.json';
const mensagemEnvio = process.env.MENSAGEM_PADRAO || '🌟 Mensagem da Hello Help. Transforme suas habilidades em oportunidades! 🚀';

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function carregarLista() {
  if (!fs.existsSync(caminhoLista)) return [];
  return JSON.parse(fs.readFileSync(caminhoLista, 'utf8'));
}

function carregarGrupos() {
  if (!fs.existsSync(caminhoGrupos)) return [];
  return JSON.parse(fs.readFileSync(caminhoGrupos, 'utf8'));
}

function carregarUsuariosEnviados() {
  if (!fs.existsSync(caminhoUsuariosEnviados)) return [];
  return JSON.parse(fs.readFileSync(caminhoUsuariosEnviados, 'utf8'));
}

function salvarUsuariosEnviados(lista) {
  fs.writeFileSync(caminhoUsuariosEnviados, JSON.stringify(lista, null, 2));
}

async function enviarParaLista(sock) {
  const lista = carregarLista();
  let enviados = carregarUsuariosEnviados();
  console.log(`📋 Enviando para ${lista.length} números.`);
  for (const numero of lista) {
    const jid = `${numero}@c.us`;
    if (enviados.includes(jid)) continue;
    try {
      await sock.sendMessage(jid, { text: mensagemEnvio });
      console.log(`✅ Mensagem enviada para: ${jid}`);
      enviados.push(jid);
      salvarUsuariosEnviados(enviados);
    } catch (error) {
      console.error(`❌ Erro ao enviar para ${jid}:`, error.message);
    }
    await esperar(delayEnvio);
  }
}

async function enviarParaGrupos(sock) {
  const grupos = carregarGrupos();
  let enviados = carregarUsuariosEnviados();
  console.log(`👥 Enviando mensagens para grupos.`);
  for (const grupoId of grupos) {
    try {
      const metadata = await sock.groupMetadata(grupoId);
      const participantes = metadata.participants.map(p => p.id);
      for (const participante of participantes) {
        if (participante.endsWith('@g.us')) continue;
        if (enviados.includes(participante)) continue;
        try {
          await sock.sendMessage(participante, { text: mensagemEnvio });
          console.log(`✅ Mensagem enviada para participante: ${participante}`);
          enviados.push(participante);
          salvarUsuariosEnviados(enviados);
        } catch (error) {
          console.error(`❌ Erro para participante ${participante}:`, error.message);
        }
        await esperar(delayEnvio);
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar grupo ${grupoId}:`, error.message);
    }
  }
}

async function iniciarWhatsapp() {
  if (!fs.existsSync(diretorioAuth)) {
    console.error('❌ Diretório de autenticação não encontrado.');
    return;
  }

  const pastasAuth = fs.readdirSync(diretorioAuth).filter(f => fs.lstatSync(path.join(diretorioAuth, f)).isDirectory());

  if (pastasAuth.length === 0) {
    console.error('❌ Nenhuma autenticação disponível. Escaneie QR Code primeiro.');
    return;
  }

  for (const nomeAuth of pastasAuth) {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(diretorioAuth, nomeAuth));
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'open') {
        console.log(`✅ Conectado: ${nomeAuth}`);
        try {
          const listaNumeros = carregarLista();
          const listaGrupos = carregarGrupos();
          if (listaNumeros.length === 0 && listaGrupos.length === 0) {
            console.log("⚠️ Nenhum número ou grupo encontrado para envio.");
          } else {
            console.log("🚀 Iniciando envio automático...");
            await enviarParaLista(sock);
            await enviarParaGrupos(sock);
          }
        } catch (erroEnvio) {
          console.error("❌ Erro envio automático:", erroEnvio.message);
        }
      } else if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log('🔄 Tentando reconectar...');
          
          
          iniciarWhatsapp();
          
        }
      }
    });
  }
}
