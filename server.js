// src/server.js
import express from "express";
import cors from "cors";
import mercadopagoModule from "mercadopago";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import { OpenAI } from "openai";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EventEmitter } from "events";
import enviarKitRoutes from "./routes/enviarKitRoutes.js";

dotenv.config();

// 🛠 Corrige limite de listeners
EventEmitter.defaultMaxListeners = 20;

// ✅ Configura caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Inicializa servidor
const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// ✅ Banco de dados local para produtos (json simulado)
const bancoProdutos = path.join("banco", "produtos.json");

// ✅ Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://hellohelp.com.br",
    "https://www.hellohelp.com.br",
  ],
  credentials: true,
}));
app.use(express.json());

// ✅ Mercado Pago
const mercadopago = mercadopagoModule.default || mercadopagoModule;
if (typeof mercadopago.configure !== "function") {
  throw new Error("❌ mercadopago.configure is not a function.");
}
mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

// ✅ SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Rotas

// Rota teste
app.get("/", (req, res) => {
  res.send("✅ API HelloHelp está no ar!");
});

// Produtos locais
app.post("/api/produtos", (req, res) => {
  try {
    const produtos = JSON.parse(fs.readFileSync(bancoProdutos));
    produtos.push(req.body);
    fs.writeFileSync(bancoProdutos, JSON.stringify(produtos, null, 2));
    res.status(201).json({ mensagem: "Produto criado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao criar produto:", error);
    res.status(500).json({ erro: "Erro ao criar produto." });
  }
});

app.get("/api/produtos", (req, res) => {
  try {
    const produtos = JSON.parse(fs.readFileSync(bancoProdutos));
    res.json(produtos);
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    res.status(500).json({ erro: "Erro ao buscar produtos." });
  }
});

// Envio de e-mail genérico
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
    console.error("❌ Erro ao enviar e-mail:", error.response?.body || error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar e-mail." });
  }
});

// OpenAI integração
app.post("/api/openai", async (req, res) => {
  const { mensagem } = req.body;

  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Você é o assistente oficial da Hello Help." },
        { role: "user", content: mensagem },
      ],
    });

    res.json({ resposta: resposta.choices[0]?.message?.content || "Resposta vazia." });
  } catch (error) {
    console.error("❌ Erro ao usar OpenAI:", error.message);
    res.status(500).json({ resposta: "Erro com IA." });
  }
});

// Mercado Pago - criar preferência
app.post("/criar-preferencia", async (req, res) => {
  try {
    const { titulo, preco, email } = req.body;

    const preference = {
      items: [{
        title: titulo,
        unit_price: parseFloat(preco),
        quantity: 1,
      }],
      payer: { email },
      back_urls: {
        success: `${CLIENT_URL}/pagamento-sucesso`,
        failure: `${CLIENT_URL}/pagamento-falha`,
        pending: `${CLIENT_URL}/pagamento-pendente`,
      },
      auto_return: "approved",
      notification_url: `${BACKEND_URL}/webhook`,
    };

    const resultado = await mercadopago.preferences.create(preference);
    res.json({ id: resultado.body.id });
  } catch (error) {
    console.error("❌ Erro ao criar preferência:", error.message);
    res.status(500).json({ error: "Erro ao criar preferência." });
  }
});

// Webhook de pagamento
app.post("/webhook", async (req, res) => {
  const evento = req.body;

  if (evento.type === "payment" && evento.data?.id) {
    try {
      const pagamentoId = evento.data.id;
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });

      const pagamentoInfo = await response.json();

      if (pagamentoInfo.status === "approved") {
        const msg = {
          to: pagamentoInfo.payer.email,
          from: "contatohellohelp@gmail.com",
          subject: "🎉 Pagamento aprovado",
          html: `<p>Obrigado por assinar o plano <strong>${pagamentoInfo.additional_info?.items?.[0]?.title || "Hello Help"}</strong>.</p>`,
        };
        await sgMail.send(msg);
      }
    } catch (error) {
      console.error("❌ Erro ao processar pagamento:", error.message);
    }
  }

  res.status(200).send("🔔 Webhook recebido");
});

// ✅ Rota de envio do Kit
app.use("/api/enviarKit", enviarKitRoutes);

// ✅ Frontend - Servir o build do Vite em produção
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ✅ Inicializa o servidor
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em: ${BACKEND_URL}`);
});
