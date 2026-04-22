// src/components/map/MapStatisticsBar.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MapStatistics } from '../../hooks/useMapStatistics';

interface MapStatisticsBarProps {
  stats: MapStatistics;
}

export default function MapStatisticsBar({ stats }: MapStatisticsBarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
      {/* PESTAÑA / BOTÓN DE TOGGLE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-t-xl border border-b-0 border-slate-200 bg-white/95 px-8 text-[11px] font-bold tracking-wide text-slate-500 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] backdrop-blur-md transition-colors hover:bg-white hover:text-blue-600"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full overflow-hidden"
          >
            <div className="flex items-center gap-7 rounded-t-2xl border-x border-t border-slate-200 bg-white/95 px-8 py-3 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur-md">
              {/* BLOQUE DE TOTALES Y CONVERSIONES */}
              <div className="flex min-w-40 flex-col">
                <div className="mb-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold leading-none text-slate-800">
                    {stats.total.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Clientes
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] leading-tight">
                  <span className="font-bold text-emerald-600">
                    {stats.activos} Activos
                  </span>
                  <span className="text-slate-400">|</span>
                  <div className="flex gap-1">
                    <span className="font-bold text-red-500">
                      {stats.inactivos} S/C
                    </span>
                    <span className="font-bold text-slate-600">
                      ({stats.conversion}%)
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] leading-tight">
                  <span className="font-bold text-blue-600">
                    {stats.ventasCampo} Campo
                  </span>
                  <span className="mx-1 text-slate-400">|</span>
                  <span className="font-bold text-purple-600">
                    {stats.ventasRemotas} Remota
                  </span>
                </div>
              </div>

              <div className="h-12 w-px bg-slate-400" />

              {/* BLOQUE DE VISITADOS Y SU CONVERSIÓN */}
              <div className="flex min-w-26 flex-col">
                <div className="mb-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold leading-none text-slate-800">
                    {stats.visitados.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Visitados
                  </span>
                </div>
                <div className="items-center text-[11px] font-medium leading-tight">
                  <span className="font-bold text-emerald-600">
                    {stats.visitadosCompraron} Activos
                  </span>
                </div>
                <div className="mt-1 items-center text-[11px] font-medium leading-tight">
                  <span className="font-bold text-red-500">
                    {stats.visitadosNoCompraron} S/C
                  </span>
                </div>
              </div>

              <div className="h-12 w-px bg-slate-400" />

              {/* BLOQUE DE TOTALES Y TICKET PROMEDIO */}
              <div className="flex min-w-36 flex-col">
                <div className="mb-1.5 flex items-baseline gap-2">
                  <span className="text-sm font-extrabold leading-none text-slate-800">
                    MXN $
                    {stats.totalMXN.toLocaleString('es-MX', {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {stats.totalUSD > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-sm font-extrabold leading-none text-slate-800">
                        USD $
                        {stats.totalUSD.toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Ticket Promedio:{' '}
                  <span className="font-bold text-slate-700">
                    $
                    {stats.ticketPromedio.toLocaleString('es-MX', {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
