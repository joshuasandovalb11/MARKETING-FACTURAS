import { ApiRequestError } from '../services/httpClient';

export const QUERY_TIMES = {
  staticCatalogStale: 1000 * 60 * 60 * 12,
  staticCatalogGc: 1000 * 60 * 60 * 24,
  clientSearchStale: 1000 * 60 * 10,
  clientSearchGc: 1000 * 60 * 30,
  analysisStale: 1000 * 60 * 5,
  analysisGc: 1000 * 60 * 30,
  invoicesStale: 1000 * 60 * 10,
  invoicesGc: 1000 * 60 * 30,
} as const;

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export const QUERY_RETRY_LIMIT = 2;

export function QUERY_RETRY(failureCount: number, error: unknown) {
  if (failureCount >= QUERY_RETRY_LIMIT) {
    return false;
  }

  if (error instanceof ApiRequestError) {
    if (error.code === 'NETWORK' || error.code === 'TIMEOUT') {
      return true;
    }

    return (
      error.code === 'HTTP' &&
      typeof error.status === 'number' &&
      RETRYABLE_HTTP_STATUSES.has(error.status)
    );
  }

  return true;
}

export function getRetryDelay(attemptIndex: number) {
  return Math.min(1000 * 2 ** attemptIndex, 10000);
}

function normalizeProviderIds(ids: string[] | undefined) {
  if (!ids || ids.length === 0) return [] as string[];

  return Array.from(
    new Set(ids.map((id) => String(id).trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function normalizeGroupIds(ids: string[] | undefined) {
  if (!ids || ids.length === 0) return [] as string[];

  return Array.from(
    new Set(ids.map((id) => String(id).trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

export function buildAnalysisQueryKey(params: {
  startDate: string;
  endDate: string;
  vendor: string;
  idProveedorIds: string[];
  idGrupoEmpresarialIds: string[];
  selectedClientKey: string | number | null;
  selectedBranchKey: string | number | null;
}) {
  const providerKey = normalizeProviderIds(params.idProveedorIds).join(',');
  const groupKey = normalizeGroupIds(params.idGrupoEmpresarialIds).join(',');

  return [
    'analysis',
    params.startDate || '',
    params.endDate || '',
    params.vendor || '',
    providerKey,
    groupKey,
    params.selectedClientKey ? String(params.selectedClientKey) : 'none',
    params.selectedBranchKey ? String(params.selectedBranchKey) : 'none',
  ] as const;
}

export function buildInvoiceQueryKey(params: {
  clientKey: string | number | null;
  idSucursal?: number;
  startDate: string;
  endDate: string;
  idProveedorIds?: string[];
}) {
  const providerKey = normalizeProviderIds(params.idProveedorIds).join(',');

  return [
    'invoices',
    params.clientKey ? String(params.clientKey) : 'none',
    params.idSucursal ?? 'none',
    params.startDate || '',
    params.endDate || '',
    providerKey,
  ] as const;
}
