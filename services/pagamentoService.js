// pagamentoService.js (backend)
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: "APP_USR-8988846279981141-040320-...2554a8-2152893907", // token de produção
});

async function criarPreferenciaPagamento({ titulo, preco, email }) {
  const preference = {
    items: [{
      title: titulo,
      unit_price: preco,
      quantity: 1
    }],
    payer: {
      email: email
    },
    back_urls: {
      success: "https://hellohelp.com.br/pagamento/sucesso",
      failure: "https://hellohelp.com.br/pagamento/erro",
    },
    auto_return: "approved",
  };

  const response = await mercadopago.preferences.create(preference);
  return response.body.id;
}

module.exports = { criarPreferenciaPagamento };
