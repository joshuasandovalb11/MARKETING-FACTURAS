const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { requestJson } from './httpClient';

export async function fetchAvailableDates(signal?: AbortSignal) {
  const json = await requestJson<unknown[]>(
    `${API_BASE_URL}/catalogos/fechas-disponibles`,
    {
      signal,
      timeoutMs: 12000,
    }
  );
  return Array.isArray(json) ? json : [];
}

export async function fetchVendors(signal?: AbortSignal) {
  const json = await requestJson<unknown[]>(
    `${API_BASE_URL}/catalogos/vendedores`,
    {
      signal,
      timeoutMs: 12000,
    }
  );
  return Array.isArray(json) ? json : [];
}

export async function fetchProveedores(signal?: AbortSignal) {
  const json = await requestJson<unknown[]>(
    `${API_BASE_URL}/catalogos/proveedores`,
    {
      signal,
      timeoutMs: 12000,
    }
  );
  return Array.isArray(json) ? json : [];
}
