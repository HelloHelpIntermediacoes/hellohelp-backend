const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const path = require("path");
const qrcode = require("qrcode-terminal"); // 📌 Adiciona o pacote para exibir o QR Code

async function main() {
  // Caminho para salvar autenticação
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, "../auth/numero1@app")
  );

  function iniciarConexao() {
    const socket = makeWASocket({
      auth: state,
      browser: ["HelloHelp", "Chrome", "10.0"],
    });

    socket.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
      if (connection === "open") {
        console.log("✅ Conectado ao WhatsApp!");
        
        // Aguarda 5 segundos antes de enviar
        setTimeout(() => {
          enviarMensagemTeste(socket);
        }, 5000);
      }
    
      if (connection === "open") {
        console.log("✅ Conectado ao WhatsApp!");
        await enviarMensagemTeste(socket);
      } else if (connection === "close") {
        const motivo = lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode
          : null;

        const deveReconectar = motivo !== DisconnectReason.loggedOut;
        console.log("⚠️ Conexão fechada. Reconectar?", deveReconectar);

        if (deveReconectar) iniciarConexao();
      }
    });

    socket.ev.on("creds.update", saveCreds);
  }

  async function enviarMensagemTeste(socket) {
    try {
      const numero = "5511970277955@s.whatsapp.net"; // Substitua por número válido
      const mensagem = "🚀 Teste automático da Hello Help com sucesso!";
      const resultado = await socket.sendMessage(numero, { text: mensagem });
      console.log("✅ Mensagem enviada com sucesso:", resultado);
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error.message || error);
    }
  }

  iniciarConexao();
}

// Chamar a função principal
main();
