import type { ApiSearchClient } from '../types';
import { requestJson } from './httpClient';
import { logNormalizationStats } from '../utils/devDiagnostics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStringOrNumber(
  record: Record<string, unknown>,
  key: string
): string | number | null {
  const value = record[key];
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return null;
}

function readNumber(
  record: Record<string, unknown>,
  key: string
): number | null {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function normalizeClientRow(row: unknown): ApiSearchClient | null {
  if (!isRecord(row)) return null;

  const id = readStringOrNumber(row, 'id');
  const idCliente = readStringOrNumber(row, 'idCliente') ?? id;
  const lat = readNumber(row, 'lat');
  const lng = readNumber(row, 'lng');

  if (id === null || idCliente === null || lat === null || lng === null) {
    return null;
  }

  const name =
    readOptionalString(row, 'name') || readOptionalString(row, 'nombre') || '';

  const idSucursalRaw = readNumber(row, 'idSucursal');

  return {
    id,
    name,
    idCliente,
    idSucursal: idSucursalRaw ?? undefined,
    nombre: readOptionalString(row, 'nombre'),
    sucursal: readOptionalString(row, 'sucursal'),
    branchName: readOptionalString(row, 'branchName'),
    lat,
    lng,
  };
}

export async function searchClientsByTerm(
  term: string,
  signal?: AbortSignal
): Promise<ApiSearchClient[]> {
  const q = encodeURIComponent(term);

  const rows = await requestJson<unknown[]>(
    `${API_BASE_URL}/clientes/buscar?q=${q}`,
    {
      signal,
      timeoutMs: 12000,
    }
  );

  if (!Array.isArray(rows)) {
    return [];
  }

  const normalized = rows
    .map(normalizeClientRow)
    .filter((item): item is ApiSearchClient => item !== null);

  logNormalizationStats({
    source: 'clientes/buscar',
    total: rows.length,
    kept: normalized.length,
  });

  return normalized;
}
