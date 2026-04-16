import type { ApiSearchClient } from '../types';
import { requestJson } from './httpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function searchClientsByTerm(
  term: string,
  signal?: AbortSignal
): Promise<ApiSearchClient[]> {
  const q = encodeURIComponent(term);

  return requestJson<ApiSearchClient[]>(
    `${API_BASE_URL}/clientes/buscar?q=${q}`,
    {
      signal,
      timeoutMs: 12000,
    }
  );
}
