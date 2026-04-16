import type { Client, Invoice } from '../types';
import { requestJson } from './httpClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface MarketingAnalysisParams {
  startDate: string;
  endDate: string;
  vendor: string;
  idProveedor: string;
  selectedClient: Client | null;
  signal?: AbortSignal;
}

export async function fetchMarketingAnalysis({
  startDate,
  endDate,
  vendor,
  idProveedor,
  selectedClient,
  signal,
}: MarketingAnalysisParams) {
  const params: Record<string, string> = {};

  if (startDate && endDate) {
    params.fechaInicio = startDate;
    params.fechaFin = endDate;
  }
  if (vendor && vendor !== 'all') {
    params.vendedor = vendor;
  }
  if (idProveedor && idProveedor !== 'all') {
    params.idProveedor = idProveedor;
  }
  if (selectedClient) {
    const clientId =
      selectedClient.marketingData?.clienteId || selectedClient.id;
    params.idCliente = String(clientId);
    if (typeof selectedClient.idSucursal === 'number') {
      params.idSucursal = String(selectedClient.idSucursal);
    }
  }

  const queryParams = new URLSearchParams(params).toString();
  return requestJson<Client[]>(`${API_BASE_URL}/analisis?${queryParams}`, {
    signal,
    timeoutMs: 20000,
  });
}

interface ClientInvoicesParams {
  clientId: string | number;
  idSucursal: number | undefined;
  startDate: string;
  endDate: string;
  idProveedor?: string;
  signal?: AbortSignal;
}

export async function fetchClientInvoices({
  clientId,
  idSucursal,
  startDate,
  endDate,
  idProveedor,
  signal,
}: ClientInvoicesParams) {
  const params = new URLSearchParams();

  if (idSucursal !== undefined) params.append('idSucursal', String(idSucursal));
  if (startDate) params.append('fechaInicio', startDate);
  if (endDate) params.append('fechaFin', endDate);
  if (idProveedor) params.append('idProveedor', idProveedor);

  return requestJson<Invoice[]>(
    `${API_BASE_URL}/facturas/cliente/${clientId}?${params.toString()}`,
    {
      signal,
      timeoutMs: 20000,
    }
  );
}
