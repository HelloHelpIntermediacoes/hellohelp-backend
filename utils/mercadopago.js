import mercadopago from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

export default mercadopago;
