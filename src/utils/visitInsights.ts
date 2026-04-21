import type { UltimaVisita, VisitaGPS } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseSafeDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function capitalizeMonth(dateLabel: string) {
  return dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
}

export function formatVendorTag(vendorId?: string | null) {
  if (!vendorId) return 'Sin vendedor';

  const cleaned = vendorId.trim().replace(/^\[|\]$/g, '');
  return cleaned ? `${cleaned}` : 'Sin vendedor';
}

export function formatExactDate(dateValue: string) {
  const safeDate = parseSafeDate(dateValue);

  const formatted = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(safeDate);

  return capitalizeMonth(formatted.replace(/\./g, ''));
}

export function formatRelativeDaysFromNow(dateValue: string) {
  const now = startOfLocalDay(new Date());
  const value = parseSafeDate(dateValue);

  const diffDays = Math.max(
    0,
    Math.round((now.getTime() - value.getTime()) / DAY_MS)
  );

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Hace 1 día';
  return `Hace ${diffDays} días`;
}

export function formatLastVisitSummary(ultimaVisita: UltimaVisita | null) {
  if (!ultimaVisita) return 'Sin registro GPS';

  return `${formatRelativeDaysFromNow(ultimaVisita.fecha)} (${formatExactDate(
    ultimaVisita.fecha
  )})`;
}

export function isFieldSaleInvoice(
  invoiceDate: string,
  historialVisitas: VisitaGPS[]
) {
  const invoiceDay = parseSafeDate(invoiceDate).getTime();

  return historialVisitas.some((visita) => {
    const visitDay = parseSafeDate(visita.fecha).getTime();
    const diffDays = Math.round((invoiceDay - visitDay) / DAY_MS);
    return diffDays >= 0 && diffDays <= 1;
  });
}
