import express from "express";
import verificarStatus from "./controller/verificarStatus.js"; // ✅ Caminho corrigido

const router = express.Router();

router.get("/verificar-status/:email", verificarStatus);

export default router;
