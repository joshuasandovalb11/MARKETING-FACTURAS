type ApiErrorCode = 'HTTP' | 'TIMEOUT' | 'NETWORK';

interface ApiTraceMeta {
  requestId: string;
  method: string;
  url: string;
  durationMs: number;
  outcome: 'success' | 'http_error' | 'timeout' | 'network' | 'canceled';
  status?: number;
}

interface RequestJsonOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: HeadersInit;
  body?: BodyInit | null;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class ApiRequestError extends Error {
  code: ApiErrorCode;
  status?: number;

  constructor(message: string, code: ApiErrorCode, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

function makeRequestId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function traceRequest(meta: ApiTraceMeta) {
  if (!import.meta.env.DEV) return;

  const statusLabel =
    typeof meta.status === 'number' ? ` status=${meta.status}` : '';
  console.debug(
    `[http] id=${meta.requestId} ${meta.method} ${meta.url} outcome=${meta.outcome}${statusLabel} durationMs=${meta.durationMs}`
  );
}

export async function requestJson<T>(
  url: string,
  options: RequestJsonOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers,
    body = null,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortHandler = () => controller.abort();
  signal?.addEventListener('abort', abortHandler, { once: true });
  const requestId = makeRequestId();
  const startedAt = performance.now();

  const getDurationMs = () => Math.round(performance.now() - startedAt);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      traceRequest({
        requestId,
        method,
        url,
        durationMs: getDurationMs(),
        outcome: 'http_error',
        status: response.status,
      });

      throw new ApiRequestError(
        `HTTP ${response.status} ${response.statusText}`,
        'HTTP',
        response.status
      );
    }

    traceRequest({
      requestId,
      method,
      url,
      durationMs: getDurationMs(),
      outcome: 'success',
      status: response.status,
    });

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (signal?.aborted && !timedOut) {
        // React Query will treat this as a canceled request.
        traceRequest({
          requestId,
          method,
          url,
          durationMs: getDurationMs(),
          outcome: 'canceled',
        });
        throw err;
      }

      traceRequest({
        requestId,
        method,
        url,
        durationMs: getDurationMs(),
        outcome: 'timeout',
      });

      throw new ApiRequestError('Tiempo de espera agotado', 'TIMEOUT');
    }

    if (err instanceof ApiRequestError) {
      traceRequest({
        requestId,
        method,
        url,
        durationMs: getDurationMs(),
        outcome:
          err.code === 'HTTP'
            ? 'http_error'
            : err.code === 'TIMEOUT'
              ? 'timeout'
              : 'network',
        status: err.status,
      });
      throw err;
    }

    traceRequest({
      requestId,
      method,
      url,
      durationMs: getDurationMs(),
      outcome: 'network',
    });

    throw new ApiRequestError('Error de red', 'NETWORK');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortHandler);
  }
}
