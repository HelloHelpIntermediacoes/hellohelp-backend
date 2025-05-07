import { MercadoPagoConfig } from 'mercadopago';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export async function criarPreferencia(req, res) {
  const { titulo, preco, email } = req.body;

  if (!titulo || !preco || !email) {
    return res.status(400).json({ erro: "Dados obrigatórios faltando: título, preço ou e-mail." });
  }

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
    };

    const resultado = await mp.preferences.create({ body: preference });

    return res.status(200).json({ url: resultado.init_point });
  } catch (error) {
    console.error("❌ Erro ao criar pagamento:", error.response?.data || error.message);
    return res.status(500).json({ erro: "Erro ao criar pagamento com o Mercado Pago." });
  }
}
