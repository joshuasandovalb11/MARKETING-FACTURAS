import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import http from 'node:http';
import https from 'node:https';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const SQL_API_URL = process.env.SQL_API_URL;

if (!SQL_API_URL) {
  throw new Error('SQL_API_URL no está definido para el puente.');
}

const BACKEND_BASE_URL = SQL_API_URL.replace(/\/api\/?$/, '');
const PORT = process.env.PORT || 3002;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 250;
const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const sharedAgentOptions = {
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 20,
  maxFreeSockets: 10,
  timeout: 60000,
};

const httpAgent = new http.Agent(sharedAgentOptions);
const httpsAgent = new https.Agent(sharedAgentOptions);

console.log(`[Vercel Bridge] Base URL del Backend: ${BACKEND_BASE_URL}`);
console.log(
  `[Vercel Bridge] Apuntando Sistema Marketing a: ${BACKEND_BASE_URL}/sistema_marketing`
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAgent(targetUrl) {
  return new URL(targetUrl).protocol === 'https:' ? httpsAgent : httpAgent;
}

function buildForwardHeaders(req) {
  const forwardedHeaders = {};

  for (const [key, value] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey === 'host' ||
      lowerKey === 'content-length' ||
      lowerKey === 'connection' ||
      lowerKey === 'accept-encoding'
    ) {
      continue;
    }

    if (typeof value === 'string') {
      forwardedHeaders[key] = value;
    }
  }

  if (!forwardedHeaders.accept) {
    forwardedHeaders.accept = 'application/json, text/plain, */*';
  }

  if (
    req.method !== 'GET' &&
    req.method !== 'HEAD' &&
    !forwardedHeaders['content-type']
  ) {
    forwardedHeaders['content-type'] = 'application/json';
  }

  return forwardedHeaders;
}

function isRetryableNetworkError(error) {
  const errorCode = error?.code || error?.errno;
  const errorName = error?.name;

  return (
    errorName === 'AbortError' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ECONNRESET' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'EAI_AGAIN' ||
    errorCode === 'ENETUNREACH' ||
    errorCode === 'EHOSTUNREACH' ||
    errorCode === 'UND_ERR_CONNECT_TIMEOUT'
  );
}

function getRetryDelay(attempt) {
  return Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, 2000);
}

function buildRequestBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  if (typeof req.body === 'string') {
    return req.body;
  }

  if (
    req.body &&
    typeof req.body === 'object' &&
    Object.keys(req.body).length > 0
  ) {
    return JSON.stringify(req.body);
  }

  return undefined;
}

async function fetchWithRetry(targetUrl, req) {
  const requestBody = buildRequestBody(req);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      console.log(
        `[Bridge] Reenviando a: ${targetUrl} (intento ${attempt + 1}/${MAX_RETRIES + 1})`
      );

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: buildForwardHeaders(req),
        body: requestBody,
        signal: controller.signal,
        agent: getAgent(targetUrl),
      });

      if (
        !response.ok &&
        RETRYABLE_HTTP_STATUS.has(response.status) &&
        attempt < MAX_RETRIES
      ) {
        console.warn(
          `[Bridge] Respuesta retryable ${response.status} para ${targetUrl}; reintentando...`
        );
        await sleep(getRetryDelay(attempt));
        continue;
      }

      return response;
    } catch (error) {
      const retryable =
        error?.name === 'AbortError' || isRetryableNetworkError(error);

      if (retryable && attempt < MAX_RETRIES) {
        console.warn(
          `[Bridge] Error retryable en ${targetUrl} (${error?.code || error?.name || 'desconocido'}); reintentando...`
        );
        await sleep(getRetryDelay(attempt));
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(
    'No se pudo completar la solicitud después de varios intentos.'
  );
}

async function forwardRequest(targetUrl, req, res) {
  const startedAt = Date.now();

  try {
    const response = await fetchWithRetry(targetUrl, req);
    const elapsedMs = Date.now() - startedAt;
    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    console.log(
      `[Bridge] ${req.method} ${targetUrl} -> ${response.status} en ${elapsedMs}ms`
    );

    res.status(response.status);

    if (contentType) {
      res.set('Content-Type', contentType);
    }

    res.send(bodyText);
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message = error?.message || String(error);

    console.error(
      `[Bridge] Error en ${req.method} ${targetUrl} después de ${elapsedMs}ms: ${message}`
    );

    if (!res.headersSent) {
      res.status(502).json({
        error: 'Error de comunicación con el servidor central.',
        detalle: message,
      });
    }
  }
}

app.use('/api/sistema_marketing', async (req, res) => {
  const subRuta = req.originalUrl.replace('/api/sistema_marketing', '');
  const targetUrl = `${BACKEND_BASE_URL}/sistema_marketing${subRuta}`;

  await forwardRequest(targetUrl, req, res);
});

// Ruta de diagnóstico
app.get('/api/health', (req, res) => {
  res
    .status(200)
    .json({ status: 'Online', bridge: 'Active', target: BACKEND_BASE_URL });
});

app.use((error, req, res, next) => {
  console.error('[Bridge] Error no controlado:', error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({ error: 'Error interno en el puente.' });
});

app.listen(PORT, () => console.log(`🚀 Puente corriendo en puerto ${PORT}`));

export default app;
