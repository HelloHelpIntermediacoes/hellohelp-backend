
import admin from "firebase-admin";
import serviceAccount from "../firebase-service-account.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hellohelp-plataforma.firebaseio.com"
  });
}

const db = admin.firestore();

const trilhas = [
  {
    numero: 1,
    titulo: "🗣️ Comunicação Eficaz",
    descricao: "Aprenda a se expressar com clareza, melhorar relacionamentos, se destacar em entrevistas e lidar com conflitos.",
    categoria: "Desenvolvimento Pessoal"
  },
  {
    numero: 2,
    titulo: "📈 Empreendedorismo e Vendas",
    descricao: "Estruture sua ideia, crie uma renda real com o que você sabe fazer e aprenda a vender com propósito.",
    categoria: "Negócios"
  },
  {
    numero: 3,
    titulo: "🧠 Inteligência Emocional",
    descricao: "Equilibre emoções, controle a ansiedade, aumente a empatia e fortaleça sua autoestima e mentalidade.",
    categoria: "Bem-Estar e Saúde Mental"
  },
  {
    numero: 4,
    titulo: "💰 Organização Financeira",
    descricao: "Aprenda a organizar seu dinheiro, quitar dívidas, usar ferramentas digitais e criar um plano de liberdade financeira.",
    categoria: "Finanças"
  },
  {
    numero: 5,
    titulo: "🖥️ Iniciação Digital",
    descricao: "Aprenda o básico do uso do computador, aplicativos e segurança digital para iniciar sua jornada online.",
    categoria: "Tecnologia"
  },
  {
    numero: 6,
    titulo: "🎓 Carreira Profissional",
    descricao: "Construa seu currículo, prepare-se para entrevistas e explore possibilidades de carreira com propósito.",
    categoria: "Empregabilidade"
  },
  {
    numero: 7,
    titulo: "🎨 Criatividade e Design",
    descricao: "Desenvolva habilidades visuais, design gráfico, criação de marcas e expressão artística.",
    categoria: "Criatividade"
  },
  {
    numero: 8,
    titulo: "🧾 Redação e Escrita Profissional",
    descricao: "Melhore sua comunicação escrita, produção de textos e documentos de forma clara e objetiva.",
    categoria: "Linguagem"
  },
  {
    numero: 9,
    titulo: "🌍 Idiomas e Comunicação Global",
    descricao: "Aprenda os fundamentos de idiomas como inglês e espanhol para ampliar suas oportunidades.",
    categoria: "Educação Complementar"
  },
  {
    numero: 10,
    titulo: "🏠 Cuidados e Atendimento Domiciliar",
    descricao: "Capacitação básica para cuidadores, babás, acompanhantes e atendimento humanizado.",
    categoria: "Serviços e Cuidado"
  }
];

async function popularTrilhas() {
  const batch = db.batch();
  const collectionRef = db.collection("trilhasHelloHelp");

  trilhas.forEach((trilha) => {
    const docRef = collectionRef.doc();
    batch.set(docRef, trilha);
  });

  try {
    await batch.commit();
    console.log("✅ Coleção 'trilhasHelloHelp' populada com sucesso!");
  } catch (erro) {
    console.error("❌ Erro ao popular trilhas:", erro);
  }
}

popularTrilhas();
