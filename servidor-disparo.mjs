import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

const pastaAuth = './auth';

// Cria a pasta auth se não existir
if (!existsSync(pastaAuth)) {
  mkdirSync(pastaAuth);
}

async function iniciarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(pastaAuth);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, printQRInTerminal: true });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection } = update;
    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp');
    } else if (connection === 'close') {
      console.log('❌ Conexão fechada. Tentando reconectar...');
      iniciarWhatsApp();
    }
  });

  return sock;
}

let sock = null;

iniciarWhatsApp().then((s) => (sock = s));

app.post('/disparar', async (req, res) => {
  try {
    if (!sock) {
      return res.status(500).send('Servidor de WhatsApp não está pronto ainda.');
    }

    const numeros = [
      '5511999999999@s.whatsapp.net',
      '5511888888888@s.whatsapp.net'
    ];

    for (const numero of numeros) {
      await sock.sendMessage(numero, { text: '🚀 Mensagem de marketing automática da Hello Help!' });
      console.log(`Mensagem enviada para ${numero}`);
    }

    res.send('Disparo iniciado!');
  } catch (error) {
    console.error('Erro no disparo:', error);
    res.status(500).send('Erro no disparo.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de disparo rodando na porta ${PORT}`);
});
