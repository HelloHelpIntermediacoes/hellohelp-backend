// firebase/firebaseConfigBackend.js
import admin from "firebase-admin";
import serviceAccount from "./firebase-service-account.json" assert { type: "json" }; // sua chave baixada do Firebase

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export { db };
