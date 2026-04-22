const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { requestJson } from './httpClient';
import { logNormalizationStats } from '../utils/devDiagnostics';

export interface CatalogVendor {
  id: string;
  nombre: string;
}

export interface CatalogProveedor {
  id: string;
  nombre: string;
}

export interface CatalogGrupoEmpresarial {
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

  const normalized = json
    .filter((item): item is string => typeof item === 'string')
    .map((date) => date.trim())
    .filter((date) => date.length > 0);

  logNormalizationStats({
    source: 'catalogos/fechas-disponibles',
    total: json.length,
    kept: normalized.length,
  });

  return normalized;
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

  const normalized = json
    .map(normalizeCatalogItem)
    .filter((item): item is CatalogVendor => item !== null);

  logNormalizationStats({
    source: 'catalogos/vendedores',
    total: json.length,
    kept: normalized.length,
  });

  return normalized;
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

  const normalized = json
    .map(normalizeCatalogItem)
    .filter((item): item is CatalogProveedor => item !== null);

  logNormalizationStats({
    source: 'catalogos/proveedores',
    total: json.length,
    kept: normalized.length,
  });

  return normalized;
}

export async function fetchGruposEmpresariales(
  signal?: AbortSignal
): Promise<CatalogGrupoEmpresarial[]> {
  const json = await requestJson<unknown[]>(
    `${API_BASE_URL}/catalogos/grupos-empresariales`,
    {
      signal,
      timeoutMs: 12000,
    }
  );

  if (!Array.isArray(json)) {
    return [];
  }

  const normalized = json
    .map(normalizeCatalogItem)
    .filter((item): item is CatalogGrupoEmpresarial => item !== null);

  logNormalizationStats({
    source: 'catalogos/grupos-empresariales',
    total: json.length,
    kept: normalized.length,
  });

  return normalized;
}
