// ✅ verificarStatus.js compatível com ESModules
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfigBackend.js";

export default async function verificarStatus(req, res) {
  const { email } = req.params;

  try {
    if (!email) {
      return res.status(400).json({ status: "erro", mensagem: "Email ausente" });
    }

    // 1. Verifica se tem algum plano aprovado no Firestore
    const planoRef = doc(db, "pagamentosHelloHelp", email);
    const planoSnap = await getDoc(planoRef);

    if (planoSnap.exists() && planoSnap.data().status === "approved") {
      const aprovadoEm = planoSnap.data().criadoEm?.toDate?.() || new Date();
      const expiraEm = new Date(aprovadoEm.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (expiraEm > new Date()) {
        return res.status(200).json({ status: "approved", criadoEm: aprovadoEm.toISOString() });
      } else {
        return res.status(200).json({ status: "expirado" });
      }
    }

    // 2. Se for plano gratuito, verifica quantidade de serviços
    const q = query(collection(db, "servicosHelloHelp"), where("email", "==", email));
    const snapshot = await getDocs(q);
    const servicosCadastrados = snapshot.size;

    if (servicosCadastrados >= 5) {
      return res.status(200).json({ status: "expirado" });
    }

    // Ainda pode usar o plano gratuito
    return res.status(200).json({ status: "ativo" });

  } catch (erro) {
    console.error("❌ Erro ao verificar status do plano:", erro);
    return res.status(500).json({ status: "erro", mensagem: "Erro interno do servidor." });
  }
}
