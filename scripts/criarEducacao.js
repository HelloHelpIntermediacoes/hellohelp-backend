// scripts/criarEducacao.js
import admin from "firebase-admin";
import fs from "fs";

// Caminho para o arquivo de credenciais do Firebase
const serviceAccount = JSON.parse(fs.readFileSync("./firebase-service-account.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const educacaoInicial = [
  {
    titulo: "Como conseguir clientes hoje mesmo",
    descricao: "Técnicas práticas e rápidas para vender seus serviços em 24h, com apoio da Hello Help.",
    link: "https://youtube.com/curso-clientes"
  },
  {
    titulo: "Crie um anúncio de impacto",
    descricao: "Aprenda como criar um anúncio que vende, com exemplos de serviços reais da plataforma.",
    link: "https://youtube.com/curso-anuncio"
  },
  {
    titulo: "Ganhe dinheiro com o que já sabe",
    descricao: "Descubra como transformar suas habilidades em renda imediata usando a Hello Help.",
    link: "https://hellohelp.com.br/blog/ganhos-imediatos"
  }
];

async function criarEducacao() {
  const batch = db.batch();

  educacaoInicial.forEach((item) => {
    const ref = db.collection("educacaoHelloHelp").doc();
    batch.set(ref, item);
  });

  await batch.commit();
  console.log("✅ Coleção 'educacaoHelloHelp' criada com conteúdos iniciais.");
}

criarEducacao().catch(console.error);
