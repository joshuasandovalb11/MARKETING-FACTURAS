import { ApiRequestError } from '../services/httpClient';

interface ErrorMessageOptions {
  fallback: string;
}

export function getUserFacingErrorMessage(
  error: unknown,
  { fallback }: ErrorMessageOptions
): string {
  if (error instanceof ApiRequestError) {
    if (error.code === 'TIMEOUT') {
      return 'La solicitud tardó demasiado. Intenta nuevamente.';
    }

    if (error.code === 'NETWORK') {
      return 'No fue posible conectar con el servidor. Verifica tu red e intenta de nuevo.';
    }

    if (error.code === 'HTTP') {
      if (typeof error.status === 'number' && error.status >= 500) {
        return 'El servidor no esta disponible por ahora. Intenta nuevamente en unos minutos.';
      }

      if (typeof error.status === 'number' && error.status === 404) {
        return 'No se encontro la informacion solicitada.';
      }

      return 'La solicitud no pudo completarse. Intenta nuevamente.';
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
