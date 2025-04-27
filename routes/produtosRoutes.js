// routes/produtosRoutes.js
import express from "express";
import fs from "fs";
const router = express.Router();

const FILE_PATH = "banco/produtos.json";

// Criar produto
router.post("/", (req, res) => {
  const novoProduto = req.body;
  const produtos = JSON.parse(fs.readFileSync(FILE_PATH));
  produtos.push(novoProduto);
  fs.writeFileSync(FILE_PATH, JSON.stringify(produtos, null, 2));
  res.status(201).json({ mensagem: "Produto criado com sucesso!" });
});

// Listar todos os produtos
router.get("/", (req, res) => {
  const produtos = JSON.parse(fs.readFileSync(FILE_PATH));
  res.json(produtos);
});

export default router;
