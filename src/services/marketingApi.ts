import type { Client, Invoice } from '../types';
import { requestJson } from './httpClient';
import { logNormalizationStats } from '../utils/devDiagnostics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readStringOrNumber(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function normalizeStatus(value: unknown): 'activo' | 'sin_compra' {
  return value === 'sin_compra' ? 'sin_compra' : 'activo';
}

function normalizeAnalysisClient(row: unknown): Client | null {
  if (!isRecord(row)) return null;

  const id = readStringOrNumber(row.id);
  const lat = readNumber(row.lat);
  const lng = readNumber(row.lng);

  if (id === null || lat === null || lng === null) {
    return null;
  }

  const marketingRaw = isRecord(row.marketingData) ? row.marketingData : {};
  const clienteId = readStringOrNumber(marketingRaw.clienteId) ?? id;

  return {
    id,
    name: readString(row.name) || 'Cliente sin nombre',
    branchName: readString(row.branchName),
    lat,
    lng,
    vendor: readString(row.vendor) ?? undefined,
    idSucursal: readNumber(row.idSucursal) ?? undefined,
    giroComercial: readString(row.giroComercial),
    marketingData: {
      clienteId,
      totalSpentMXN: readNumber(marketingRaw.totalSpentMXN) ?? 0,
      totalSpentUSD: readNumber(marketingRaw.totalSpentUSD) ?? 0,
      ordersCount: readNumber(marketingRaw.ordersCount) ?? 0,
      lastPurchase: readString(marketingRaw.lastPurchase),
      status: normalizeStatus(marketingRaw.status),
    },
  };
}

function normalizeInvoiceItem(item: unknown) {
  if (!isRecord(item)) return null;

  const descripcion = readString(item.descripcion);
  const cantidad = readNumber(item.cantidad);
  const precioUnitario = readNumber(item.precioUnitario);
  const totalLinea = readNumber(item.totalLinea);
  const proveedor = readString(item.proveedor);

  if (
    descripcion === null ||
    cantidad === null ||
    precioUnitario === null ||
    totalLinea === null ||
    proveedor === null
  ) {
    return null;
  }

  return {
    descripcion,
    cantidad,
    precioUnitario,
    totalLinea,
    proveedor,
  };
}

function normalizeInvoiceRow(row: unknown): Invoice | null {
  if (!isRecord(row)) return null;

  const idFactura = readStringOrNumber(row.idFactura);
  const fecha = readString(row.fecha);
  const total = readNumber(row.total);
  const moneda = readString(row.moneda);

  if (
    idFactura === null ||
    fecha === null ||
    total === null ||
    moneda === null
  ) {
    return null;
  }

  const articulosRaw = Array.isArray(row.articulos) ? row.articulos : [];
  const proveedoresRaw = Array.isArray(row.proveedoresUnicos)
    ? row.proveedoresUnicos
    : [];

  return {
    idFactura,
    fecha,
    total,
    moneda,
    articulos: articulosRaw
      .map(normalizeInvoiceItem)
      .filter(
        (item): item is NonNullable<ReturnType<typeof normalizeInvoiceItem>> =>
          item !== null
      ),
    proveedoresUnicos: proveedoresRaw.filter(
      (item): item is string => typeof item === 'string'
    ),
  };
}

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
  const rows = await requestJson<unknown[]>(
    `${API_BASE_URL}/analisis?${queryParams}`,
    {
      signal,
      timeoutMs: 20000,
    }
  );

  if (!Array.isArray(rows)) {
    return [];
  }

  const normalized = rows
    .map(normalizeAnalysisClient)
    .filter((item): item is Client => item !== null);

  logNormalizationStats({
    source: 'analisis',
    total: rows.length,
    kept: normalized.length,
  });

  return normalized;
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

  const rows = await requestJson<unknown[]>(
    `${API_BASE_URL}/facturas/cliente/${clientId}?${params.toString()}`,
    {
      signal,
      timeoutMs: 20000,
    }
  );

  if (!Array.isArray(rows)) {
    return [];
  }

  const normalized = rows
    .map(normalizeInvoiceRow)
    .filter((item): item is Invoice => item !== null);

  logNormalizationStats({
    source: 'facturas/cliente',
    total: rows.length,
    kept: normalized.length,
  });

  return normalized;
}
