const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");
const { OpenAI } = require("openai");
const fetch = require("node-fetch");
const crypto = require("crypto");

const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

dotenv.config(); // 🔹 Carrega as variáveis do .env

// 🔧 Inicializa Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

// Configura SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configura OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ✅ Middleware de verificação da assinatura do Webhook
function verificarAssinaturaMercadoPago(req, res, next) {
  const assinaturaRecebida = req.headers["x-signature"];
  const corpo = JSON.stringify(req.body);
  const chaveSecreta = process.env.MP_WEBHOOK_SECRET;

  const assinaturaCalculada = crypto
    .createHmac("sha256", chaveSecreta)
    .update(corpo)
    .digest("hex");

  if (assinaturaRecebida !== assinaturaCalculada) {
    console.warn("🚫 Webhook com assinatura inválida.");
    return res.status(403).json({ sucesso: false, mensagem: "Assinatura inválida." });
  }

  next();
}

/**
 * 📬 Envia e-mail
 */
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
    console.error("Erro ao enviar email:", error.response?.body || error);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar email." });
  }
});

/**
 * 🤖 Integração OpenAI
 */
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

🌟 Sempre que possível, incentive:
- Fazer o teste de perfil
- Cadastrar produtos e serviços
- Explorar o marketplace
- Falar com consultores
- Acessar oportunidades

🌟 Responda também perguntas gerais sobre qualquer assunto, com foco em educação, criatividade e acolhimento. Incentive o crescimento pessoal, profissional, financeiro e espiritual.

Seja como a fundadora da Hello Help: inspirador, motivador, inteligente, gentil e com visão de impacto social. Use emojis para tornar a conversa leve e acessível.
          `.trim(),
        },
        { role: "user", content: mensagem },
      ],
    });

    const respostaIA = resposta.choices[0]?.message?.content;
    res.json({ resposta: respostaIA || "Resposta vazia da IA." });
  } catch (error) {
    console.error("Erro ao chamar IA:", error?.response?.data || error.message);
    res.status(500).json({ resposta: "Erro ao tentar responder com a IA." });
  }
});

/**
 * 💳 Criar link de pagamento
 */
app.post("/api/criar-pagamento", async (req, res) => {
  const { titulo, preco, email } = req.body;

  try {
    const preference = {
      items: [
        {
          title: titulo,
          quantity: 1,
          unit_price: parseFloat(preco),
        },
      ],
      payer: {
        email: email,
      },
      back_urls: {
        success: process.env.CLIENT_URL + "/pagamento-sucesso",
        failure: process.env.CLIENT_URL + "/pagamento-falha",
        pending: process.env.CLIENT_URL + "/pagamento-pendente",
      },
      auto_return: "approved",
    };

    const resultado = await mercadopago.preferences.create(preference);
    res.status(200).json({ url: resultado.body.init_point });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ erro: "Erro ao criar pagamento." });
  }
});

/**
 * 📓 Webhook Mercado Pago
 */
app.post("/api/pagamento-aprovado", verificarAssinaturaMercadoPago, async (req, res) => {
  const pagamento = req.body;

  console.log("📩 Notificação recebida:", JSON.stringify(pagamento, null, 2));

  try {
    if (
      pagamento.type === "payment" &&
      pagamento.action === "payment.created" &&
      pagamento.data?.id
    ) {
      const pagamentoId = pagamento.data.id;

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      });

      const pagamentoInfo = await response.json();

      if (pagamentoInfo.status === "approved") {
        const emailComprador = pagamentoInfo.payer.email;
        const valorPago = pagamentoInfo.transaction_amount;
        const planoComprado = pagamentoInfo.additional_info?.items?.[0]?.title || "Plano não identificado";

        console.log(`✅ Pagamento confirmado: ${emailComprador} comprou ${planoComprado}`);

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
          html: `
            <p>Olá!</p>
            <p>Seu pagamento do plano <strong>${planoComprado}</strong> foi confirmado com sucesso.</p>
            <p>Você já pode acessar todas as funcionalidades premium da Hello Help! 🎉</p>
            <br/>
            <p>Abra seu painel e aproveite 😉</p>
            <p>Equipe Hello Help</p>
          `,
        };

        await sgMail.send(msg);
        return res.status(200).json({ sucesso: true, mensagem: "Plano ativado com sucesso." });
      }
    }

    return res.status(400).json({ sucesso: false, mensagem: "Pagamento não aprovado ou evento inválido." });
  } catch (error) {
    console.error("❌ Erro no processamento:", error.message);
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao processar pagamento." });
  }
});

// ✅ ADIÇÃO FINAL PARA O RENDER FUNCIONAR
app.get("/", (req, res) => {
  res.send("✅ API Hello Help online!");
});

// 🚀 Inicializa o servidor
app.listen(PORT, () => {
  console.log(`✅ Backend Hello Help rodando na porta ${PORT}`);
});
