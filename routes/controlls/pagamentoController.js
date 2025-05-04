import { MercadoPagoConfig } from "mercadopago";
import { db } from "../firebase/firebaseConfig.js";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Configuração do Mercado Pago
const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/**
 * 🎯 Cria uma preferência de pagamento com dados do cliente
 */
export const criarPreferencia = async (req, res) => {
  const { titulo, preco, email } = req.body;

  try {
    const preference = {
      items: [
        {
          title: titulo,
          unit_price: parseFloat(preco),
          quantity: 1,
        },
      ],
      payer: { email },
      back_urls: {
        success: `${process.env.CLIENT_URL}/pagamento-sucesso`,
        failure: `${process.env.CLIENT_URL}/pagamento-falha`,
        pending: `${process.env.CLIENT_URL}/pagamento-pendente`,
      },
      auto_return: "approved",
      notification_url: `${process.env.API_URL}/api/pagamento-aprovado` // Garanta que está no painel do MP também
    };

    const resultado = await mp.preferences.create({ body: preference });
    res.status(200).json({ url: resultado.init_point });
  } catch (error) {
    console.error("❌ Erro ao criar pagamento:", error.message);
    res.status(500).json({ erro: "Erro ao criar pagamento." });
  }
};

/**
 * 🔁 Recebe notificações de pagamento via Webhook
 */
export const receberNotificacao = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment" && data?.id) {
      const pagamento = await mp.payment.findById(data.id);
      const status = pagamento.body.status;
      const email = pagamento.body.payer?.email;
      const valor = pagamento.body.transaction_amount;
      const metodo = pagamento.body.payment_method_id;

      if (status === "approved" && email) {
        await setDoc(doc(db, "pagamentosHelloHelp", email), {
          status,
          valor,
          metodo,
          criadoEm: new Date().toISOString(),
        });
        console.log("✅ Pagamento aprovado e salvo no Firebase:", email);
      } else {
        console.log("⚠️ Pagamento não aprovado ou sem email:", status, email);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.message);
    res.sendStatus(500);
  }
};

/**
 * 🕵️ Verifica status de pagamento pelo e-mail
 */
export const verificarStatusPagamento = async (req, res) => {
  try {
    const { email } = req.params;
    const ref = doc(db, "pagamentosHelloHelp", email);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return res.status(200).json(snap.data());
    } else {
      return res.status(404).json({ status: "aguardando" });
    }
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error.message);
    return res.status(500).json({ erro: "Erro interno" });
  }
};
