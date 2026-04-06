import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const SQL_API_URL = process.env.SQL_API_URL;

const BACKEND_BASE_URL = SQL_API_URL.replace(/\/api\/?$/, '');
const PORT = process.env.PORT || 3002;

console.log(`[Vercel Bridge] Base URL del Backend: ${BACKEND_BASE_URL}`);
console.log(
  `[Vercel Bridge] Apuntando Sistema Marketing a: ${BACKEND_BASE_URL}/sistema_marketing`
);

app.use('/api/sistema_marketing', async (req, res) => {
  const subRuta = req.originalUrl.replace('/api/sistema_marketing', '');

  const targetUrl = `${BACKEND_BASE_URL}/sistema_marketing${subRuta}`;

  forwardRequest(targetUrl, req, res);
});

async function forwardRequest(targetUrl, req, res) {
  try {
    console.log(`[Bridge] Reenviando a: ${targetUrl}`);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `Error remoto: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Error en Bridge:', error.message);
    res
      .status(500)
      .json({ error: 'Error de comunicación con el servidor central.' });
  }
}

// Ruta de diagnóstico
app.get('/api/health', (req, res) => {
  res
    .status(200)
    .json({ status: 'Online', bridge: 'Active', target: BACKEND_BASE_URL });
});

app.listen(PORT, () => console.log(`🚀 Puente corriendo en puerto ${PORT}`));

export default app;
