// index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import { OpenAI } from "openai";
import fetch from "node-fetch";
import crypto from "crypto";
import admin from "firebase-admin";
import mercadopagoModule from "mercadopago"; // ✅ Correto
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";

dotenv.config();

// 🔥 Configurar Firebase
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

// ✅ Corrigido MercadoPago
const mercadopago = mercadopagoModule.default || mercadopagoModule;
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 🔒 Função para verificar webhook MercadoPago
function verificarAssinaturaMercadoPago(req, res, next) {
  const assinaturaRecebida = req.headers["x-signature"];
  const corpo = JSON.stringify(req.body);
  const chaveSecreta = process.env.MP_WEBHOOK_SECRET;

  const assinaturaCalculada = crypto.createHmac("sha256", chaveSecreta).update(corpo).digest("hex");

  if (assinaturaRecebida !== assinaturaCalculada) {
    console.warn("🚫 Webhook com assinatura inválida.");
    return res.status(403).json({ sucesso: false, mensagem: "Assinatura inválida." });
  }
  next();
}

// 📨 Envio de E-mail
app.post("/enviar-email", async (req, res) => {
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

// 🤖 Envio para OpenAI
app.post("/api/openai", async (req, res) => {
  const { mensagem } = req.body;

  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
Você é o assistente oficial da Hello Help. Sua missão é acolher o usuário, guiá-lo com inteligência, empatia e clareza para transformar habilidades em oportunidades reais de renda.
🌟 Sempre incentive:
- Fazer o teste de perfil
- Cadastrar produtos e serviços
- Explorar o marketplace
- Falar com consultores
- Buscar oportunidades
Use emojis para tornar a conversa leve e inspiradora.`.trim(),
        },
        { role: "user", content: mensagem },
      ],
    });

    const respostaIA = resposta.choices[0]?.message?.content;
    res.json({ resposta: respostaIA || "Resposta vazia da IA." });
  } catch (error) {
    console.error("Erro ao chamar IA:", error.response?.data || error.message);
    res.status(500).json({ resposta: "Erro ao tentar responder com a IA." });
  }
});

// 💵 Criar pagamento MercadoPago
app.post("/api/criar-pagamento", async (req, res) => {
  const { titulo, preco, email } = req.body;

  try {
    const preference = {
      items: [{ title: titulo, quantity: 1, unit_price: parseFloat(preco) }],
      payer: { email },
      back_urls: {
        success: `${process.env.CLIENT_URL}/pagamento-sucesso`,
        failure: `${process.env.CLIENT_URL}/pagamento-falha`,
        pending: `${process.env.CLIENT_URL}/pagamento-pendente`,
      },
      auto_return: "approved",
    };

    const resultado = await mercadopago.preferences.create(preference);
    res.status(200).json({ url: resultado.body.init_point });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error.message);
    res.status(500).json({ erro: "Erro ao criar pagamento." });
  }
});

// ✅ Pagamento aprovado
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
          html: `<p>Olá!</p><p>Seu pagamento do plano <strong>${planoComprado}</strong> foi confirmado com sucesso.</p><p>Agora você já pode acessar todas as funcionalidades premium da Hello Help! 🎉</p><p>Equipe Hello Help 💙</p>`,
        };

        await sgMail.send(msg);
        return res.status(200).json({ sucesso: true, mensagem: "Plano ativado com sucesso." });
      }
    }
    return res.status(400).json({ sucesso: false, mensagem: "Pagamento não aprovado ou evento inválido." });
  } catch (error) {
    console.error("❌ Erro no processamento do pagamento:", error.message);
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao processar pagamento." });
  }
});

// 🌐 Teste de servidor
app.get("/", (req, res) => {
  res.send("✅ API Hello Help online!");
});

// 🚀 Iniciar o servidor
app.listen(PORT, () => {
  console.log(`✅ Backend Hello Help rodando na porta ${PORT}`);
  iniciarWhatsapp();
});

// 🔥 WhatsApp Disparador

const delayEnvio = 10000;
const diretorioAuth = './auth';
const caminhoLista = './lista.json';
const caminhoGrupos = './gruposPermitidos.json';
const caminhoUsuariosEnviados = './usuariosEnviados.json';
const mensagemEnvio = process.env.MENSAGEM_PADRAO || "🌟 Olá! Esta é uma mensagem oficial da Hello Help. Vamos transformar habilidades em oportunidades! 🚀";

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
  console.log(`👥 Enviando mensagens para participantes dos grupos.`);

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
          console.error(`❌ Erro ao enviar para participante ${participante}:`, error.message);
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
    console.error("❌ Diretório de autenticação não encontrado.");
    return;
  }

  const pastasAuth = fs.readdirSync(diretorioAuth).filter(f => fs.lstatSync(path.join(diretorioAuth, f)).isDirectory());

  if (pastasAuth.length === 0) {
    console.error("❌ Nenhuma autenticação disponível. Escaneie QR Code primeiro.");
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

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") {
        console.log(`✅ Conectado com sucesso: ${nomeAuth}`);
        try {
          const listaNumeros = carregarLista();
          const listaGrupos = carregarGrupos();
          if (listaNumeros.length === 0 && listaGrupos.length === 0) {
            console.log("⚠️ Nenhum número ou grupo encontrado para envio.");
          } else {
            console.log("🚀 Iniciando envios...");
            await enviarParaLista(sock);
            await enviarParaGrupos(sock);
          }
        } catch (erroEnvio) {
          console.error("❌ Erro durante envio automático:", erroEnvio.message);
        }
      } else if (connection === "close") {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log("🔄 Tentando reconectar...");
          iniciarWhatsapp();
        }
      }
    });
  }
}
