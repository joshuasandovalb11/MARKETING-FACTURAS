export const QUERY_TIMES = {
  staticCatalogStale: 1000 * 60 * 60 * 12,
  staticCatalogGc: 1000 * 60 * 60 * 24,
  analysisStale: 1000 * 60 * 5,
  analysisGc: 1000 * 60 * 30,
  invoicesStale: 1000 * 60 * 10,
  invoicesGc: 1000 * 60 * 30,
} as const;

export const QUERY_RETRY = 1;

function normalizeProviderIds(ids: string[] | undefined) {
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
  selectedClientKey: string | number | null;
  selectedBranchKey: string | number | null;
}) {
  const providerKey = normalizeProviderIds(params.idProveedorIds).join(',');

  return [
    'analysis',
    params.startDate || '',
    params.endDate || '',
    params.vendor || '',
    providerKey,
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
