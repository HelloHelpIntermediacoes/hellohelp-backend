import admin from "firebase-admin";
import serviceAccount from "../firebase-service-account.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hellohelp-plataforma.firebaseio.com"
  });
}

const db = admin.firestore();


const conteudos = [
  {
    titulo: "Como fazer sua primeira venda em 24h (mesmo sem experiência)",
    descricao: "Descubra técnicas simples e acessíveis para realizar sua primeira venda com estratégias digitais.",
    link: "https://hotmart.com/pt-br/blog/primeira-venda",
    tipo: "Dica prática",
  },
  {
    titulo: "Introdução à Educação Financeira",
    descricao: "Organize sua vida financeira com lições básicas de controle, metas e investimentos iniciais.",
    link: "https://www.serasa.com.br/educacao-financeira/",
    tipo: "Artigo educativo",
  },
  {
    titulo: "Crie seu currículo online gratuitamente",
    descricao: "Use esse gerador de currículo gratuito e tenha um modelo pronto em minutos.",
    link: "https://www.canva.com/resumes/",
    tipo: "Ferramenta prática",
  },
  {
    titulo: "Curso de Atendimento ao Cliente com Certificado",
    descricao: "Aprenda a atender com excelência e aumente sua chance de ser contratado.",
    link: "https://www.ev.org.br/cursos/atendimento-ao-cliente",
    tipo: "Curso gratuito",
  },
  {
    titulo: "Empreendedorismo na prática: comece com o que você tem",
    descricao: "Entenda como iniciar um negócio sem capital e usando o que já sabe.",
    link: "https://sebrae.com.br/sites/PortalSebrae/cursosonline",
    tipo: "Curso SEBRAE",
  },
  {
    titulo: "Curso básico de Marketing Digital",
    descricao: "Aprenda a vender mais usando redes sociais e tráfego gratuito.",
    link: "https://www.alura.com.br/artigos/marketing-digital-por-onde-comecar",
    tipo: "Conteúdo introdutório",
  },
  {
    titulo: "Aprenda programação do zero com vídeos no YouTube",
    descricao: "Domine HTML, CSS e JavaScript com este canal gratuito e didático.",
    link: "https://www.youtube.com/c/CursoemVideo",
    tipo: "Canal recomendado",
  },
  {
    titulo: "Trilhas de carreira para profissionais iniciantes",
    descricao: "Veja por onde começar se deseja entrar no mercado de TI, Design, RH, Vendas ou Finanças.",
    link: "https://www.linkedin.com/learning/",
    tipo: "Trilha de aprendizagem",
  },
  {
    titulo: "Dicas de entrevista: como se destacar na vaga",
    descricao: "Descubra frases, postura e o que evitar para garantir sua contratação.",
    link: "https://g1.globo.com/educacao/noticia/2023/03/22/entrevista-de-emprego.ghtml",
    tipo: "Artigo de apoio",
  },
  {
    titulo: "Inteligência emocional aplicada à vida e ao trabalho",
    descricao: "Melhore seu foco, empatia e decisões pessoais e profissionais.",
    link: "https://www.ted.com/talks/daniel_goleman_why_emotional_intelligence_matters",
    tipo: "TED Talk",
  }
];

async function popularFirebase() {
  const batch = db.batch();
  const collectionRef = db.collection("educacaoHelloHelp");

  conteudos.forEach((item) => {
    const docRef = collectionRef.doc(); // gera ID automático
    batch.set(docRef, item);
  });

  try {
    await batch.commit();
    console.log("✅ Coleção 'educacaoHelloHelp' populada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao popular:", error);
  }
}

popularFirebase();
