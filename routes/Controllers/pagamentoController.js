import { criarPreferenciaPagamento } from "../services/mercadoPagoService.js";

export const criarPreferencia = async (req, res) => {
  const { titulo, preco, email } = req.body;

  try {
    const item = {
      title: titulo,
      unit_price: parseFloat(preco),
      quantity: 1,
    };

    const response = await criarPreferenciaPagamento(item, email);
    res.json({ id: response.body.id });
  } catch (error) {
    console.error("Erro ao criar preferência:", error.message);
    res.status(500).json({ erro: error.message });
  }
};

export const receberNotificacao = (req, res) => {
  console.log("🔔 Notificação recebida do Mercado Pago:", req.body);
  res.sendStatus(200);
};
