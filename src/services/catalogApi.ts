const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { requestJson } from './httpClient';

export interface CatalogVendor {
  id: string;
  nombre: string;
}

export interface CatalogProveedor {
  id: string;
  nombre: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function normalizeCatalogItem(item: unknown): CatalogVendor | null {
  if (!isRecord(item)) return null;

  const id = toStringValue(item.id);
  const nombre = toStringValue(item.nombre);

  if (!id || !nombre) {
    return null;
  }

  return { id, nombre };
}

export async function fetchAvailableDates(
  signal?: AbortSignal
): Promise<string[]> {
  const json = await requestJson<unknown[]>(
    `${API_BASE_URL}/catalogos/fechas-disponibles`,
    {
      signal,
      timeoutMs: 12000,
    }
  );

  if (!Array.isArray(json)) {
    return [];
  }

  return json
    .filter((item): item is string => typeof item === 'string')
    .map((date) => date.trim())
    .filter((date) => date.length > 0);
}

export async function fetchVendors(
  signal?: AbortSignal
): Promise<CatalogVendor[]> {
  const json = await requestJson<unknown[]>(
    `${API_BASE_URL}/catalogos/vendedores`,
    {
      signal,
      timeoutMs: 12000,
    }
  );

  if (!Array.isArray(json)) {
    return [];
  }

  return json
    .map(normalizeCatalogItem)
    .filter((item): item is CatalogVendor => item !== null);
}

export async function fetchProveedores(
  signal?: AbortSignal
): Promise<CatalogProveedor[]> {
  const json = await requestJson<unknown[]>(
    `${API_BASE_URL}/catalogos/proveedores`,
    {
      signal,
      timeoutMs: 12000,
    }
  );

  if (!Array.isArray(json)) {
    return [];
  }

  return json
    .map(normalizeCatalogItem)
    .filter((item): item is CatalogProveedor => item !== null);
}
