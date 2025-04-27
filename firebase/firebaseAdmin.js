// hellohelp-backend/firebase/firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Garante o __dirname corretamente no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lê o JSON de conta de serviço
const serviceAccountPath = path.resolve(__dirname, "firebase-service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("❌ Arquivo firebase-service-account.json não encontrado.");
}

const raw = fs.readFileSync(serviceAccountPath, "utf8");
const serviceAccount = JSON.parse(raw);

// Inicializa o app apenas se ainda não foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
