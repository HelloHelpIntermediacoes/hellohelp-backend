// src/pages/MarketingDisparo.js

import { db } from "@/firebase/firebaseConfig";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import axios from "axios";
import ValidaAcessoInterno from "../../routes/ValidaAcessoInterno";

export default function MarketingDisparo() {
  const [status, setStatus] = useState("");
  const numerosEnvio = [
    "5511970277955@c.us",
    "443308181815@c.us",
    "5567999349343@c.us",
  ];

  async function buscarNovosPerfis() {
    const snapshot = await getDocs(collection(db, "usuariosHelloHelp"));
    return snapshot.docs.map((doc) => doc.data());
  }

  async function buscarNovosProdutos() {
    const snapshot = await getDocs(collection(db, "produtosHelloHelp"));
    return snapshot.docs.map((doc) => doc.data());
  }

  async function buscarNovasOportunidades() {
    const snapshot = await getDocs(collection(db, "oportunidadesHelloHelp"));
    return snapshot.docs.map((doc) => doc.data());
  }

  async function dispararMensagens(mensagens) {
    setStatus("Enviando mensagens...");
    for (const numero of numerosEnvio) {
      for (const mensagem of mensagens) {
        try {
          await axios.post("http://localhost:3333/enviar", {
            numero,
            mensagem,
          });
          console.log(`Mensagem enviada para ${numero}: ${mensagem}`);
          await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s delay
        } catch (error) {
          console.error(`Erro ao enviar para ${numero}:`, error.message);
        }
      }
    }
    setStatus("Disparo finalizado!");
  }

  async function dispararTudo() {
    try {
      const perfis = await buscarNovosPerfis();
      const produtos = await buscarNovosProdutos();
      const oportunidades = await buscarNovasOportunidades();

      const mensagensPerfis = perfis.map(
        (p) => `🚀 Novo perfil: ${p.nome || "Nome não informado"}. Área de atuação: ${p.area || "Área não informada"}. Confira no site Hello Help!`
      );

      const mensagensProdutos = produtos.map(
        (p) => `🛒 Novo produto: ${p.nome || "Produto"} disponível! Preço: R$${p.preco || "-"}. Acesse a Hello Help!`
      );

      const mensagensOportunidades = oportunidades.map(
        (o) => `💼 Nova oportunidade: ${o.descricao || "Oportunidade"} em ${o.local || "localidade"}. Veja mais na Hello Help!`
      );

      const todasMensagens = [...mensagensPerfis, ...mensagensProdutos, ...mensagensOportunidades];

      if (todasMensagens.length === 0) {
        setStatus("Nenhuma novidade para disparar.");
        return;
      }

      await dispararMensagens(todasMensagens);
    } catch (error) {
      console.error("Erro no disparo geral:", error.message);
      setStatus("Erro ao disparar mensagens.");
    }
  }

  return (
    <ValidaAcessoInterno setor="marketing">
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-2xl font-bold text-pink-700 mb-4">📣 Disparo de Novidades</h1>

        <button
          onClick={dispararTudo}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
        >
          🚀 Disparar todas as novidades
        </button>

        <p className="mt-4 text-gray-700">{status}</p>
      </div>
    </ValidaAcessoInterno>
  );
}
