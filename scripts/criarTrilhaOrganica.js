// scripts/criarTrilhaOrganica.js
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../firebase/firebase-service-account.json" assert { type: "json" }; // ✅ Caminho certo

// Inicialização do Firebase Admin SDK
const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

// 📚 Dados da trilha educacional
const trilha = {
  titulo: "Inteligência Emocional",
  area: "Desenvolvimento Pessoal",
  tipo: "Trilha",
  destaque: true,
  descricao:
    "Equilibre emoções, controle a ansiedade, aumente a empatia e fortaleça sua autoestima e mentalidade.",
  conteudos: [
    "Autoconhecimento",
    "Controle da ansiedade",
    "Captação e escuta ativa",
    "Mindfulness e foco",
    "Exercícios de resiliência",
  ],
  duracao: "Livre",
  nivel: "Básico",
  modalidade: "Online",
  certificado: true,
  mentor: true,
  gratuito: false,
  publicoAlvo: [
    "Adolescentes",
    "Adultos",
    "Profissionais",
    "Educadores",
    "Empreendedores",
  ],
  objetivo:
    "Ajudar o usuário a desenvolver autoconsciência, empatia e resiliência emocional em sua jornada profissional e pessoal.",
  criadoEm: new Date(),
};

// 🚀 Função para gravar no Firestore
async function criarTrilha() {
  try {
    await db.collection("trilhasEducacionais").doc("3").set(trilha); // ID fixo: "3"
    console.log("✅ Trilha educacional criada com sucesso!");
  } catch (e) {
    console.error("❌ Erro ao criar trilha:", e);
  }
}

criarTrilha();
