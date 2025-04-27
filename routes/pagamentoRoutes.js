import express from "express";
import { criarPreferencia, receberNotificacao } from "../controllers/pagamentoController.js";

const router = express.Router();

router.post("/criar-preferencia", criarPreferencia);
router.post("/pagamento-aprovado", receberNotificacao);

export default router;
