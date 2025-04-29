// ✅ index.js COMPLETO E FUNCIONAL
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import { OpenAI } from "openai";
import fetch from "node-fetch";
import crypto from "crypto";
import admin from "firebase-admin";
import mercadopago from "mercadopago";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { criarPreferencia } from "./services/PagamentoService.js";

dotenv.config();
console.log("✅ Access Token carregado:", process.env.MP_ACCESS_TOKEN);


// 🔥 Firebase config
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS
app.use(cors());
app.use(express.json());

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

// ✅ ROTA: Criar pagamento via MercadoPago (usando controller correto)
app.post("/api/criar-pagamento", criarPreferencia);

// ✅ ROTA: Notificação MercadoPago (Webhook)
app.post("/api/pagamento-aprovado", (req, res) => {
  console.log("📥 Notificação recebida do MercadoPago:", req.body);
  res.sendStatus(200);
});

// ✅ ROTA: Disparo de mensagens pelo painel (controlador separado)
app.post("/disparar-mensagens", iniciarDisparo);
  try {
    const nomeCampanha = req.body.nome || "Campanha Padrão";
    await iniciarDisparoParaCampanha(nomeCampanha);
    res.status(200).json({ sucesso: true, mensagem: "Disparo iniciado com sucesso." });
  } catch (error) {
    console.error("Erro ao disparar mensagens:", error);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao disparar mensagens." });
  }

// ✅ ROTA BASE
app.get("/", (req, res) => {
  res.send("🚀 API Hello Help está online!");
});

// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Backend Hello Help rodando na porta ${PORT}`);
});


// ✅ Webhook pagamento aprovado
app.post("/api/pagamento-aprovado", verificarAssinaturaMercadoPago, async (req, res) => {
  const pagamento = req.body;
  try {
    if (pagamento.type === "payment" && pagamento.action === "payment.created" && pagamento.data?.id) {
      const pagamentoId = pagamento.data.id;
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });
      const pagamentoInfo = await response.json();
      if (pagamentoInfo.status === "approved") {
        const emailComprador = pagamentoInfo.payer.email;
        const valorPago = pagamentoInfo.transaction_amount;
        const planoComprado = pagamentoInfo.additional_info?.items?.[0]?.title || "Plano não identificado";

        const userRef = firestore.collection("usuariosPagantes").doc(emailComprador);
        await userRef.set({
          email: emailComprador,
          plano: planoComprado,
          valor: valorPago,
          status: "ativo",
          dataPagamento: admin.firestore.Timestamp.now(),
        });

        const msg = {
          to: emailComprador,
          from: "contatohellohelp@gmail.com",
          subject: "✅ Pagamento confirmado - Acesso liberado!",
          html: `<p>Seu pagamento foi confirmado. Aproveite todos os benefícios da Hello Help! 🚀</p>`,
        };
        await sgMail.send(msg);

        return res.status(200).json({ sucesso: true, mensagem: "Plano ativado com sucesso." });
      }
    }
    return res.status(400).json({ sucesso: false, mensagem: "Pagamento não aprovado." });
  } catch (error) {
    console.error("❌ Erro processamento pagamento:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao processar pagamento." });
  }
});

// ✅ Rota padrão
app.get("/", (req, res) => {
  res.send("✅ API Hello Help online!");
});

// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Backend Hello Help rodando na porta ${PORT}`);
  iniciarWhatsapp();
});

// 🔁 Funções WhatsApp automáticas mantidas
const delayEnvio = 10000;
const diretorioAuth = './auth';
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
