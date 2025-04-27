import mercadopago from "mercadopago";

// ✅ Configuração com token direto do código (pode mover depois para .env para segurança)
mercadopago.configure({
  access_token: 'APP_USR-8988846279981141-040320-bb1e482d20f0cf25c0a86a8f1e2554a8-2152893907'
});

/**
 * 🔁 Cria uma preferência de pagamento no Mercado Pago
 * @param {Object} item - Objeto com { title, unit_price, quantity }
 * @param {string} email - E-mail do comprador
 * @returns {Object} - Dados da preferência criada
 */
export const criarPreferenciaPagamento = async (item, email) => {
  try {
    const preference = {
      items: [item],
      payer: {
        email: email
      },
      back_urls: {
        success: "http://localhost:5173/qrcode",
        failure: "http://localhost:5173/pagamento-falha",
        pending: "http://localhost:5173/pagamento-pendente"
      },
      auto_return: "approved",
      notification_url: "https://e7a8-2804-14d-783d-8dba-245c-9601-a6d1-918c.ngrok-free.app/api/pagamento-aprovado"
    };

    const response = await mercadopago.preferences.create(preference);
    return response.body;
  } catch (erro) {
    console.error("❌ Erro ao criar preferência de pagamento:", erro);
    throw erro;
  }
};
