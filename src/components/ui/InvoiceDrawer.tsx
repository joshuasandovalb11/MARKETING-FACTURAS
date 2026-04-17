// src/components/ui/InvoiceDrawer.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Package, Building2 } from 'lucide-react';
import type { Client } from '../../types';
import { useClientInvoices } from '../../hooks/useClientInvoices';
import {
  resolveErrorMessageNotification,
  resolveErrorNotification,
} from '../../utils/notificationPolicy';
import { useNotificationToast } from '../../hooks/useNotificationToast';

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  filters: { startDate: string; endDate: string; idProveedorIds: string[] };
}

const cap = (s?: string | null) =>
  s ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '';

const formatProviders = (providers: string[]) => {
  if (!providers || providers.length === 0) return 'Sin proveedor';
  if (providers.length === 1) return cap(providers[0]);
  if (providers.length === 2)
    return `${cap(providers[0])}, ${cap(providers[1])}`;
  return `${cap(providers[0])}, ${cap(providers[1])} y +${providers.length - 2}`;
};

export default function InvoiceDrawer({
  isOpen,
  onClose,
  client,
  filters,
}: InvoiceDrawerProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const { notify } = useNotificationToast();
  const clientKey = client?.marketingData?.clienteId || client?.id || 'none';
  const branchKey = client?.idSucursal ?? 'none';
  const drawerContextKey = `${clientKey}:${branchKey}:${filters.startDate}:${filters.endDate}:${filters.idProveedorIds.join(',') || 'all'}`;

  const {
    data: invoices,
    isLoading,
    isError,
    error,
    refetch,
  } = useClientInvoices({
    clientId: client?.marketingData?.clienteId || client?.id,
    idSucursal: client?.idSucursal,
    startDate: filters.startDate,
    endDate: filters.endDate,
    isOpen,
    idProveedorIds: filters.idProveedorIds,
  });

  const toggle = (id: string | number) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const totalMXN =
    invoices
      ?.filter((i) => i.moneda.startsWith('M'))
      .reduce((s, i) => s + i.total, 0) || 0;

  const totalUSD =
    invoices
      ?.filter((i) => i.moneda.startsWith('D') || i.moneda.startsWith('U'))
      .reduce((s, i) => s + i.total, 0) || 0;

  const invoiceErrorMessage = resolveErrorNotification({
    scope: 'invoice-drawer',
    error,
    fallback: 'Error al cargar facturas.',
  }).message;

  useEffect(() => {
    setExpandedId(null);
  }, [drawerContextKey, isOpen]);

  useEffect(() => {
    if (!isOpen || !isError) return;

    notify(
      resolveErrorMessageNotification({
        scope: 'invoice-drawer',
        message: invoiceErrorMessage,
        fallback: 'Error al cargar facturas.',
      })
    );
  }, [isError, invoiceErrorMessage, notify]);

  return (
    <AnimatePresence>
      {isOpen && client && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-20 cursor-pointer"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className="absolute top-0 right-0 h-full z-30 flex flex-col bg-white border-l border-slate-200"
            style={{ width: '320px' }}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  Facturas
                </p>
                <p className="flex text-sm font-semibold text-slate-800 truncate leading-tight">
                  #{client.marketingData?.clienteId} {' - '}
                  {cap(client.name)}
                </p>
                {client.branchName && (
                  <p className="text-[11px] text-blue-500 font-medium truncate">
                    {cap(client.branchName)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-3 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-xs">Cargando...</p>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
                  <p className="text-xs text-red-400 text-center">
                    {invoiceErrorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void refetch();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : invoices && invoices.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const isOpen = expandedId === inv.idFactura;
                    const totalUnidades = inv.articulos.reduce(
                      (s, a) => s + a.cantidad,
                      0
                    );

                    return (
                      <div key={inv.idFactura}>
                        {/* FILA DE FACTURA */}
                        <button
                          onClick={() => toggle(inv.idFactura)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0 text-slate-500"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            {/* ROW SUPERIOR: ID de Factura + Fecha */}
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">
                                  #{inv.idFactura}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {new Date(inv.fecha).toLocaleDateString(
                                    'es-MX',
                                    {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    }
                                  )}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-800 shrink-0">
                                $
                                {inv.total.toLocaleString('es-MX', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                                <span className="text-[10px] font-medium text-slate-800 ml-1">
                                  {inv.moneda}
                                </span>
                              </span>
                            </div>

                            {/* ROW INFERIOR: Proveedores + Totales */}
                            <div className="flex items-center justify-between gap-3 mt-1">
                              <div
                                className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0"
                                title={inv.proveedoresUnicos
                                  .map(cap)
                                  .join(', ')}
                              >
                                <Building2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {formatProviders(inv.proveedoresUnicos)}
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                                <Package className="w-3 h-3" />
                                {inv.articulos.length} prod - {totalUnidades}{' '}
                                uni
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* DETALLE EXPANDIBLE (ARTÍCULOS) */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-3 bg-slate-50 border-t border-slate-100">
                                <div className="pt-2 space-y-3">
                                  {inv.articulos.map((art, i) => (
                                    <div
                                      key={i}
                                      className="flex items-start justify-between gap-3 text-[11px]"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-stone-700 font-medium leading-tight truncate">
                                          {art.descripcion}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                                          {cap(art.proveedor)}
                                        </p>
                                        <p className="text-slate-500 mt-0.5">
                                          {art.cantidad} × $
                                          {art.precioUnitario.toLocaleString(
                                            'es-MX'
                                          )}
                                        </p>
                                      </div>
                                      <span className="text-slate-700 font-semibold shrink-0">
                                        $
                                        {art.totalLinea.toLocaleString(
                                          'es-MX',
                                          {
                                            minimumFractionDigits: 2,
                                          }
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-slate-400">
                    Sin facturas en este periodo.
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER — Resumen Apilado MXN/USD */}
            {invoices && invoices.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-300 bg-slate-50 shrink-0">
                <div className="flex justify-between items-end text-[12px] text-slate-600">
                  <span>{invoices.length} facturas</span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-bold text-green-700 leading-none">
                      MXN $
                      {totalMXN.toLocaleString('es-MX', {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {totalUSD > 0 && (
                      <span className="font-semibold text-green-700 leading-none">
                        USD $
                        {totalUSD.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
