import express from 'express';
import cors from 'cors';
import { enviarMensagens } from './disparoController.js'; // importando a função de disparo

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

app.post('/disparar', async (req, res) => {
  try {
    const { nomeAuth } = req.body;
    await enviarMensagens(nomeAuth); // Envia as mensagens
    res.status(200).send('Disparo iniciado com sucesso!');
  } catch (error) {
    res.status(500).send('Erro ao iniciar disparo.');
    console.error('Erro no disparo:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de disparo rodando na porta ${PORT}`);
});
