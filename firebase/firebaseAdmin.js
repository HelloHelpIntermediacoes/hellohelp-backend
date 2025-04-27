// hellohelp-backend/firebase/firebaseAdmin.js
import admin from "firebase-admin";

// Pega o conteúdo do service account da variável de ambiente
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicializa o app apenas se ainda não foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
