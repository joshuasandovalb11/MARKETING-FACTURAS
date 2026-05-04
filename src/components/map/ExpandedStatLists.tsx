// src/components/map/ExpandedStatLists.tsx
import { CarFront, PhoneCall } from 'lucide-react';
import type { ClientDetail, VendorSummary } from '../../hooks/useMapStatistics';
import { formatVendorTag } from '../../utils/visitInsights';

const capitalizeStr = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const parseClientId = (rawId: string) => {
  const [numeroCliente, sucursalId] = rawId.split('_');
  return {
    numeroCliente: numeroCliente ?? rawId,
    sucursalId: sucursalId ?? '',
  };
};

const visitChipClassName =
  'inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] 2xl:text-[12px] font-bold text-blue-600 bg-blue-50 border border-blue-100/50 whitespace-nowrap';

function getBreakpointMax() {
  if (typeof window === 'undefined') return 3;
  const w = window.innerWidth;
  return w >= 1536 ? 6 : 3;
}

function VisitDatesChips({ dates }: { dates: string[] }) {
  const breakpointMax = getBreakpointMax();
  const visibleCount = Math.min(dates.length, breakpointMax);
  const overflowCount = dates.length - visibleCount;

  return (
    <div className="min-w-0 max-w-full">
      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden whitespace-nowrap">
        {dates.slice(0, visibleCount).map((date) => (
          <span key={date} className={visitChipClassName}>
            {date}
          </span>
        ))}

        {overflowCount > 0 && (
          <span className={visitChipClassName}>+{overflowCount} visitas</span>
        )}
      </div>
    </div>
  );
}

export function ClientSummaryList({ clients }: { clients: ClientDetail[] }) {
  if (clients.length === 0) {
    return (
      <div className="p-4 text-center text-xs font-medium text-slate-400">
        No hay clientes para mostrar.
      </div>
    );
  }

  return (
    <>
      {clients.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between border-b border-slate-100 pb-2.5 pt-1.5 last:border-0 hover:bg-slate-50/50 transition-colors rounded-md px-2 -mx-2"
        >
          <div className="flex min-w-0 flex-1 flex-col pr-4">
            <div className="flex gap-1 truncate text-xs 2xl:text-sm font-extrabold text-slate-800">
              <span>#{parseClientId(c.id).numeroCliente}</span>
              <span>{capitalizeStr(c.nombre)}</span>
              {c.sucursal && (
                <span className="font-bold text-blue-600">
                  ({capitalizeStr(c.sucursal)})
                </span>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] 2xl:text-[11px] font-bold uppercase tracking-wider ${
                  c.status === 'activo'
                    ? 'bg-emerald-100/80 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {c.status === 'activo' ? 'C/C' : 'S/C'}
              </span>

              {c.status === 'activo' &&
                (c.ventaEnCampo ? (
                  <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] 2xl:text-[11px] font-bold uppercase text-blue-600 border border-blue-100/50">
                    <CarFront className="h-2.5 w-2.5" /> Campo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[9px] 2xl:text-[11px] font-bold uppercase text-purple-600 border border-purple-100/50">
                    <PhoneCall className="h-2.5 w-2.5" /> Remota
                  </span>
                ))}

              {c.fechasVisitas && c.fechasVisitas.length > 0 && (
                <VisitDatesChips dates={c.fechasVisitas} />
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end text-right">
            <span className="text-sm font-extrabold text-slate-800">
              $
              {c.ventaMXN.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </span>
            {c.ventaUSD > 0 && (
              <span className="mt-0.5 text-[10px] 2xl:text-[12px] font-bold text-slate-600">
                USD $
                {c.ventaUSD.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </span>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ==========================================
// 2. LISTA DE AUDITORÍA (VISITADOS)
// ==========================================
export function VisitsSummaryList({ visits }: { visits: ClientDetail[] }) {
  if (visits.length === 0) {
    return (
      <div className="p-4 text-center text-xs font-medium text-slate-400">
        No hay visitas registradas.
      </div>
    );
  }

  return (
    <>
      {visits.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between border-b border-slate-100 pb-2.5 pt-1.5 last:border-0 hover:bg-slate-50/50 transition-colors rounded-md px-2 -mx-2"
        >
          <div className="flex min-w-0 flex-1 flex-col pr-4">
            <div className="flex gap-1 truncate text-xs 2xl:text-sm font-extrabold text-slate-800">
              <span>#{parseClientId(v.id).numeroCliente}</span>
              <span>{capitalizeStr(v.nombre)}</span>
              {v.sucursal && (
                <span className="font-bold text-blue-600">
                  ({capitalizeStr(v.sucursal)})
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] 2xl:text-[11px] font-bold uppercase tracking-wider ${
                  v.status === 'activo'
                    ? 'bg-emerald-100/80 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {v.status === 'activo' ? 'Visitado (C/C)' : 'Visitado (S/C)'}
              </span>

              <span className="rounded px-1.5 py-0.5 text-[10px] 2xl:text-[12px] tracking-widest font-bold text-orange-800 bg-orange-100">
                {formatVendorTag(v.vendedor)}
              </span>

              {v.fechasVisitas && v.fechasVisitas.length > 0 && (
                <VisitDatesChips dates={v.fechasVisitas} />
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end text-right">
            <span className="text-sm font-extrabold text-slate-800">
              $
              {v.ventaMXN.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </span>
            {v.ventaUSD > 0 && (
              <span className="mt-0.5 text-[10px] 2xl:text-[12px] font-bold text-slate-600">
                USD $
                {v.ventaUSD.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </span>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ==========================================
// 3. LISTA DE FINANZAS (VENDEDORES)
// ==========================================
export function VendorSummaryList({ vendors }: { vendors: VendorSummary[] }) {
  if (vendors.length === 0) {
    return (
      <div className="p-4 text-center text-xs font-medium text-slate-400">
        No hay información financiera.
      </div>
    );
  }

  return (
    <>
      {vendors.map((v) => {
        const inactivos = v.clientes - v.activos;

        return (
          <div
            key={v.vendedor}
            className="flex items-center justify-between border-b border-slate-100 pb-2.5 pt-1.5 last:border-0 hover:bg-slate-50/50 transition-colors rounded-md px-2 -mx-2"
          >
            <div className="flex min-w-0 flex-1 flex-col pr-4">
              <span className="truncate text-xs font-extrabold uppercase tracking-wide text-slate-800">
                {formatVendorTag(v.vendedor)}
              </span>

              <div className="mt-1.5 flex items-center gap-2 text-[10px] 2xl:text-[12px] font-bold text-slate-500">
                <span>
                  <span className="text-slate-800">{v.clientes}</span> Clientes
                </span>
                <span className="text-slate-200">|</span>
                <span className="text-emerald-600">{v.activos} Activos</span>
                <span className="text-slate-200">|</span>
                <span className="text-red-600">{inactivos} Inactivos</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end text-right">
              <span className="text-sm font-extrabold text-slate-800">
                $
                {v.ventaMXN.toLocaleString('es-MX', {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="mt-0.5 text-[10px] 2xl:text-[12px] font-bold text-slate-500">
                Promedio: $
                {v.ticketPromedio.toLocaleString('es-MX', {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
