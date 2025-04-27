import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

const delayEnvio = 30000; // tempo entre mensagens (30 segundos)
const diretorioAuth = './auth'; // pasta onde ficam as autenticações
const mensagem = 'Olá, esta é uma mensagem de teste.'; // Mensagem de teste

let usuariosEnviados = [];
const numeroTeste = '5567999349343@c.us'; // Número de teste

async function iniciarConexao(nomeAuth) {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(diretorioAuth, nomeAuth));
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log(`✅ Conectado com sucesso: ${nomeAuth}`);
      // Teste de envio de mensagem
      enviarMensagemTeste(sock);
    } else if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        iniciarConexao(nomeAuth);
      }
    }
  });

  return sock;
}

async function enviarMensagemTeste(sock) {
  try {
    console.log(`Enviando mensagem de teste para: ${numeroTeste}`);
    await sock.sendMessage(numeroTeste, { text: mensagem })
      .then(response => {
        console.log(`Resposta do envio de teste: ${JSON.stringify(response)}`);
      })
      .catch(error => {
        console.error(`Erro ao enviar mensagem de teste: ${error.message}`);
      });
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error.message);
  }
}

// Inicializa a conexão
async function principal() {
  const pastasAuth = fs.readdirSync(diretorioAuth).filter(f => fs.lstatSync(path.join(diretorioAuth, f)).isDirectory());

  if (pastasAuth.length === 0) {
    console.error('❌ Nenhuma pasta de auth encontrada em /auth. Escaneie um QR Code primeiro.');
    return;
  }

  for (const nomeAuth of pastasAuth) {
    await iniciarConexao(nomeAuth);
  }
}

principal();
