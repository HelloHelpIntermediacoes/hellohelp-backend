import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

const diretorioAuth = './auth';
const gruposPermitidos = JSON.parse(fs.readFileSync('./gruposPermitidos.json'));
const usuariosEnviados = JSON.parse(fs.readFileSync('./usuariosEnviados.json'));
const mensagem = fs.readFileSync('./mensagem.txt', 'utf-8').trim();
const delayEnvio = 30000; // 30 segundos

async function enviarMensagens() {
  const pastasAuth = fs.readdirSync(diretorioAuth).filter(f => fs.lstatSync(path.join(diretorioAuth, f)).isDirectory());
  if (pastasAuth.length === 0) {
    console.error('Nenhuma pasta auth encontrada.');
    return;
  }
  for (const nomeAuth of pastasAuth) {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(diretorioAuth, nomeAuth));
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state, printQRInTerminal: true });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection }) => {
      if (connection === 'open') {
        console.log(`✅ Conectado!`);
        const grupos = await sock.groupFetchAllParticipating();
        const contatosParaEnviar = [];

        for (const jid in grupos) {
          const grupo = grupos[jid];
          if (gruposPermitidos.includes(grupo.subject)) {
            const metadata = await sock.groupMetadata(jid);
            metadata.participants.forEach((user) => {
              if (!usuariosEnviados.includes(user.id)) {
                contatosParaEnviar.push(user.id);
              }
            });
          }
        }

        console.log(`Encontrados ${contatosParaEnviar.length} contatos para enviar.`);

        for (const contato of contatosParaEnviar) {
          try {
            await sock.sendMessage(contato, { text: mensagem });
            console.log(`Mensagem enviada para: ${contato}`);
            usuariosEnviados.push(contato);
            fs.writeFileSync('./usuariosEnviados.json', JSON.stringify(usuariosEnviados, null, 2));
            await new Promise(resolve => setTimeout(resolve, delayEnvio));
          } catch (err) {
            console.error(`Erro ao enviar para ${contato}:`, err.message);
          }
        }
      }
    });
  }
}

export { enviarMensagens };
