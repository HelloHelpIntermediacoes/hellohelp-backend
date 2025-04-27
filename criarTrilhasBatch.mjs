import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../firebase-service-account.json' assert { type: 'json' };

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function criarTrilhas() {
  await db.collection('trilhasEducacionais').doc('1').set({
  "titulo": "Autoconhecimento e Prop\u00f3sito",
  "descricao": "Desperte sua ess\u00eancia, descubra talentos e defina metas com clareza.",
  "conteudos": [
    "Teste de Perfil e Personalidade",
    "Mini curso: Qual \u00e9 meu talento?",
    "Exerc\u00edcio de Metas e Direcionamento"
  ],
  "categoria": "Desenvolvimento Pessoal",
  "publico": [
    "Iniciantes",
    "Adultos",
    "Profissionais",
    "Adolescentes"
  ],
  "duracao": "Livre",
  "nivel": "B\u00e1sico",
  "modalidade": "Online",
  "certificado": true,
  "mentor": true,
  "gratuito": true,
  "criadoEm": "2025-04-22T02:36:41.768473"
});
  await db.collection('trilhasEducacionais').doc('2').set({
  "titulo": "Empreendedorismo do Zero",
  "descricao": "Aprenda a tirar ideias do papel, organizar, divulgar e vender com prop\u00f3sito.",
  "conteudos": [
    "Curso: Como Estruturar Seu Neg\u00f3cio",
    "Aula: Marketing de Baixo Custo",
    "Roteiro: Pitch de Apresenta\u00e7\u00e3o"
  ],
  "categoria": "Neg\u00f3cios",
  "publico": [
    "Empreendedores",
    "Aut\u00f4nomos"
  ],
  "duracao": "7 dias",
  "nivel": "Intermedi\u00e1rio",
  "modalidade": "Online",
  "certificado": true,
  "mentor": true,
  "gratuito": false,
  "criadoEm": "2025-04-22T02:36:41.768852"
});
  await db.collection('trilhasEducacionais').doc('3').set({
  "titulo": "Finan\u00e7as B\u00e1sicas e Consumo Consciente",
  "descricao": "Saiba como organizar seu dinheiro, evitar d\u00edvidas e consumir de forma inteligente.",
  "conteudos": [
    "Planilha Simples de Controle",
    "Mini curso: Cart\u00e3o, Pix, Empr\u00e9stimos",
    "Dicas para Evitar Golpes Financeiros"
  ],
  "categoria": "Educa\u00e7\u00e3o Financeira",
  "publico": [
    "Todos",
    "Fam\u00edlias",
    "Adolescentes",
    "Aut\u00f4nomos"
  ],
  "duracao": "5 dias",
  "nivel": "B\u00e1sico",
  "modalidade": "Online",
  "certificado": true,
  "mentor": false,
  "gratuito": true,
  "criadoEm": "2025-04-22T02:36:41.768956"
});
  await db.collection('trilhasEducacionais').doc('4').set({
  "titulo": "Intelig\u00eancia Emocional na Pr\u00e1tica",
  "descricao": "Equilibre emo\u00e7\u00f5es, controle a ansiedade e fortale\u00e7a sua autoestima e mentalidade.",
  "conteudos": [
    "Autocontrole emocional",
    "Empatia e escuta ativa",
    "Exerc\u00edcios de resili\u00eancia"
  ],
  "categoria": "Sa\u00fade Mental",
  "publico": [
    "Adolescentes",
    "Adultos",
    "Profissionais"
  ],
  "duracao": "Livre",
  "nivel": "B\u00e1sico",
  "modalidade": "Online",
  "certificado": true,
  "mentor": true,
  "gratuito": false,
  "criadoEm": "2025-04-22T02:36:41.769019"
});
  await db.collection('trilhasEducacionais').doc('5').set({
  "titulo": "Cidadania e \u00c9tica Social",
  "descricao": "Entenda direitos, deveres e desenvolva consci\u00eancia para uma sociedade melhor.",
  "conteudos": [
    "Curso: \u00c9tica no Dia a Dia",
    "Leitura: Constitui\u00e7\u00e3o e Direitos do Cidad\u00e3o",
    "Oficina: Participa\u00e7\u00e3o Social e Voluntariado"
  ],
  "categoria": "Educa\u00e7\u00e3o Complementar",
  "publico": [
    "Todos",
    "Estudantes",
    "Comunidade",
    "Professores"
  ],
  "duracao": "10 dias",
  "nivel": "Intermedi\u00e1rio",
  "modalidade": "Online e Presencial",
  "certificado": true,
  "mentor": false,
  "gratuito": true,
  "criadoEm": "2025-04-22T02:36:41.769056"
});
  await db.collection('trilhasEducacionais').doc('6').set({
  "titulo": "Trilha Profissional para Aut\u00f4nomos",
  "descricao": "Profissionalize seu trabalho informal com t\u00e9cnicas, postura e valoriza\u00e7\u00e3o.",
  "conteudos": [
    "Curso: Como se apresentar ao cliente",
    "Modelos de proposta",
    "Mentoria com especialista"
  ],
  "categoria": "Capacita\u00e7\u00e3o Profissional",
  "publico": [
    "Aut\u00f4nomos",
    "Freelancers"
  ],
  "duracao": "3 dias",
  "nivel": "Intermedi\u00e1rio",
  "modalidade": "Online",
  "certificado": true,
  "mentor": true,
  "gratuito": false,
  "criadoEm": "2025-04-22T02:36:41.769091"
});
  console.log('✅ Trilhas educacionais criadas com sucesso!');
}

criarTrilhas();
