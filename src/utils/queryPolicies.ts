export const QUERY_TIMES = {
  staticCatalogStale: 1000 * 60 * 60 * 12,
  staticCatalogGc: 1000 * 60 * 60 * 24,
  analysisStale: 1000 * 60 * 5,
  analysisGc: 1000 * 60 * 30,
  invoicesStale: 1000 * 60 * 10,
  invoicesGc: 1000 * 60 * 30,
} as const;

export const QUERY_RETRY = 1;

export function buildAnalysisQueryKey(params: {
  startDate: string;
  endDate: string;
  vendor: string;
  idProveedor: string;
  selectedClientKey: string | number | null;
  selectedBranchKey: string | number | null;
}) {
  return [
    'analysis',
    params.startDate || '',
    params.endDate || '',
    params.vendor || '',
    params.idProveedor || '',
    params.selectedClientKey ? String(params.selectedClientKey) : 'none',
    params.selectedBranchKey ? String(params.selectedBranchKey) : 'none',
  ] as const;
}

export function buildInvoiceQueryKey(params: {
  clientKey: string | number | null;
  idSucursal?: number;
  startDate: string;
  endDate: string;
  idProveedor?: string;
}) {
  return [
    'invoices',
    params.clientKey ? String(params.clientKey) : 'none',
    params.idSucursal ?? 'none',
    params.startDate || '',
    params.endDate || '',
    params.idProveedor || '',
  ] as const;
}
