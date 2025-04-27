// criarTrilha.mjs
import admin from "firebase-admin";
import serviceAccount from "../firebase-service-account.json" assert { type: "json" };

// Inicializa o Firebase com as credenciais
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Dados da trilha a ser inserida
const trilha = {
  titulo: "Trilha Iniciante – Descoberta de Potencial",
  descricao: "Essa trilha foi pensada para pessoas que desejam descobrir seus talentos e iniciar sua evolução profissional. Com conteúdos acessíveis e apoio de mentores, você será guiado do autoconhecimento à ação.",
  conteudos: [
    "✅ Teste de Perfil Profissional",
    "✅ Aula: Autoconhecimento e Vocação",
    "✅ Mini curso: Como transformar talento em renda",
    "✅ Material de apoio (PDF interativo)"
  ],
  mentor: true,
  gratuito: true,
  nivel: "Iniciante",
  duracao: "3h",
  modalidade: "Online",
  certificado: true
};

// Inserir no Firestore
async function inserirTrilha() {
  try {
    const ref = db.collection("trilhasEducacionais").doc("1");
    await ref.set(trilha);
    console.log("✅ Trilha educacional criada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar trilha:", error);
  }
}

inserirTrilha();
