// scripts/registrarTrilhaIniciada.mjs
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../../firebase-service-account.json" assert { type: "json" };

// Inicializa o Firebase com credencial administrativa
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// 🔁 Simulação de trilha iniciada
const trilhaIniciada = {
  uidUsuario: "uid_exemplo_123",
  nomeUsuario: "João da Silva",
  trilhaId: "3",
  trilhaTitulo: "Inteligência Emocional",
  dataInicio: new Date(),
  status: "iniciada",
  visualizadoPorConsultor: false
};

// Grava a trilha na coleção
async function registrarTrilha() {
  try {
    const ref = await db.collection("trilhasIniciadasHelloHelp").add(trilhaIniciada);
    console.log(`✅ Trilha iniciada registrada com ID: ${ref.id}`);
  } catch (e) {
    console.error("❌ Erro ao registrar trilha iniciada:", e);
  }
}

registrarTrilha();
