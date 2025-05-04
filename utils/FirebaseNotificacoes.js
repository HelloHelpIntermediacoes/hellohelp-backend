// utils/FirebaseNotificacoes.js
import admin from "firebase-admin";
import serviceAccount from "../firebase/firebase-service-account.json"; // ajuste se estiver em outro local

// ✅ Inicializa o Firebase Admin (evita múltiplas inicializações)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 🔔 Função para registrar notificação
export async function registrarNotificacao({ usuarioId, titulo, descricao }) {
  if (!usuarioId || !titulo || !descricao) {
    console.warn("🚫 Dados incompletos para criar notificação.");
    return;
  }

  const notificacao = {
    usuarioId,
    titulo,
    descricao,
    lido: false,
    data: admin.firestore.Timestamp.now(),
  };

  try {
    await admin.firestore().collection("notificacoesHelloHelp").add(notificacao);
    console.log(`✅ Notificação registrada para UID: ${usuarioId}`);
  } catch (erro) {
    console.error("❌ Erro ao registrar notificação:", erro.message);
  }
}
