// 📁 controllers/disparoController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys";

// Diretórios e mensagens
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const diretorioAuth = path.resolve(__dirname, "../auth");
const caminhoGrupos = path.resolve(__dirname, "../gruposPermitidos.json");
const caminhoUsuariosEnviados = path.resolve(__dirname, "../usuariosEnviados.json");

const mensagemEnvio = process.env.MENSAGEM_PADRAO || "🌟 Mensagem da Hello Help. Transforme suas habilidades em oportunidades! 🚀";
const delayEnvio = 8000;

// Utilitários
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function carregarGrupos() {
  if (!fs.existsSync(caminhoGrupos)) return [];
  return JSON.parse(fs.readFileSync(caminhoGrupos, "utf8"));
}

function carregarUsuariosEnviados() {
  if (!fs.existsSync(caminhoUsuariosEnviados)) return [];
  return JSON.parse(fs.readFileSync(caminhoUsuariosEnviados, "utf8"));
}

function salvarUsuariosEnviados(lista) {
  fs.writeFileSync(caminhoUsuariosEnviados, JSON.stringify(lista, null, 2));
}

// ✅ Função principal de disparo
export async function iniciarDisparo(req, res) {
  try {
    const nomeCampanha = req.body.nome || "Campanha Padrão";
    console.log(`📣 Iniciando disparo: ${nomeCampanha}`);

    if (!fs.existsSync(diretorioAuth)) {
      console.error("❌ Diretório auth não encontrado.");
      return res.status(500).json({ sucesso: false, mensagem: "Auth não encontrado." });
    }

    const pastasAuth = fs.readdirSync(diretorioAuth).filter(f => fs.lstatSync(path.join(diretorioAuth, f)).isDirectory());
    if (pastasAuth.length === 0) {
      return res.status(400).json({ sucesso: false, mensagem: "Nenhuma sessão WhatsApp ativa. Escaneie o QR Code primeiro." });
    }

    for (const nomeAuth of pastasAuth) {
      const pasta = path.join(diretorioAuth, nomeAuth);
      const { state } = await useMultiFileAuthState(pasta);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({ version, auth: state, printQRInTerminal: true });

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
          console.log("✅ Conectado. Disparando mensagens para os grupos...");

          const grupos = carregarGrupos();
          const enviados = carregarUsuariosEnviados();

          for (const grupoId of grupos) {
            try {
              const metadata = await sock.groupMetadata(grupoId);
              const participantes = metadata.participants.map(p => p.id);

              for (const participante of participantes) {
                if (enviados.includes(participante)) continue;
                if (participante.endsWith("@g.us")) continue;

                try {
                  await sock.sendMessage(participante, { text: mensagemEnvio });
                  console.log(`📨 Enviado para: ${participante}`);
                  enviados.push(participante);
                  salvarUsuariosEnviados(enviados);
                } catch (erro) {
                  console.error(`Erro ao enviar para ${participante}:`, erro.message);
                }

                await esperar(delayEnvio);
              }
            } catch (erroGrupo) {
              console.error(`Erro no grupo ${grupoId}:`, erroGrupo.message);
            }
          }

          return res.status(200).json({ sucesso: true, mensagem: "Disparo finalizado com sucesso!" });
        }

        if (connection === "close") {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          if (shouldReconnect) {
            console.log("🔁 Reconectando...");
          }
        }
      });
    }
  } catch (erro) {
    console.error("❌ Erro geral no disparo:", erro.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no disparo de mensagens." });
  }
}
