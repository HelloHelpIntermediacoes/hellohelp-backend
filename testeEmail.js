// ✅ hellohelp-backend/testeEmail.js
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "felixcampos63040@gmail.com", // ✅ Destinatário
  from: "contatohellohelp@gmail.com", // ✅ Remetente verificado
  subject: "Teste direto de envio via SendGrid ✅",
  html: `
    <h1>Funcionou!</h1>
    <p>Este é um teste de envio feito diretamente do Node.js via SendGrid.</p>
    <p><strong>Se chegou, está tudo certo. Se não chegou, vamos investigar mais.</strong></p>
  `
};

sgMail
  .send(msg)
  .then(() => {
    console.log("✅ E-mail de teste enviado com sucesso!");
  })
  .catch((error) => {
    console.error("❌ Erro ao enviar e-mail:", error.response?.body || error.message);
  });
