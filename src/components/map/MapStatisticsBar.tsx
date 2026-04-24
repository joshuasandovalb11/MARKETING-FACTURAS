// src/components/map/MapStatisticsBar.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MapStatistics } from '../../hooks/useMapStatistics';
import SummaryListWrapper from './SummaryListWrapper';
import {
  ClientSummaryList,
  VisitsSummaryList,
  VendorSummaryList,
} from './ExpandedStatLists';

interface MapStatisticsBarProps {
  stats: MapStatistics;
}

type SectionType = 'clientes' | 'visitas' | 'finanzas' | null;

export default function MapStatisticsBar({ stats }: MapStatisticsBarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSection, setExpandedSection] = useState<SectionType>(null);

  const handleSectionClick = (section: SectionType) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center max-w-[98vw]">
      {/* PESTAÑA / BOTÓN DE TOGGLE PRINCIPAL */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setExpandedSection(null);
        }}
        className="flex items-center gap-1.5 2xl:gap-2 rounded-t-lg 2xl:rounded-t-xl border border-b-0 border-slate-200 bg-white/95 px-5 2xl:px-8 py-0.5 text-[9px] 2xl:text-[11px] font-bold tracking-wide text-slate-500 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] backdrop-blur-md transition-colors hover:bg-white hover:text-blue-600"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
        ) : (
          <ChevronUp className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
        )}
      </button>

      {/* CONTENEDOR PRINCIPAL ANIMADO */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-max max-w-full overflow-hidden"
          >
            <div className="flex flex-col rounded-t-xl 2xl:rounded-t-2xl border-x border-t border-slate-200 bg-white/95 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur-md">
              {/* FILA DE ESTADÍSTICAS */}
              <div className="flex items-stretch justify-center w-full">
                {/* BOTÓN 1: CLIENTES */}
                <button
                  onClick={() => handleSectionClick('clientes')}
                  className={`flex flex-1 flex-col items-start justify-center px-4 2xl:px-8 py-2 2xl:py-3 text-center transition-colors rounded-tl-xl 2xl:rounded-tl-2xl cursor-pointer whitespace-nowrap ${
                    expandedSection === 'clientes'
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="mb-1 2xl:mb-1.5 flex items-baseline justify-center gap-1 2xl:gap-1.5">
                    <span className="text-lg 2xl:text-xl font-extrabold leading-none text-slate-800">
                      {stats.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] 2xl:text-xs font-bold uppercase tracking-wider text-slate-500">
                      Clientes
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 2xl:gap-2 text-[9px] 2xl:text-[11px] leading-tight">
                    <span className="font-bold text-emerald-600">
                      {stats.activos} Activos
                    </span>
                    <span className="ml-1 font-bold text-slate-600">
                      ({stats.conversion}%)
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-red-500">
                      {stats.inactivos} S/C
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1.5 2xl:gap-2 text-[9px] 2xl:text-[11px] leading-tight">
                    <span className="font-bold text-blue-600">
                      {stats.ventasCampo} Campo
                    </span>
                    <span className="mx-1 text-slate-300">|</span>
                    <span className="font-bold text-purple-600">
                      {stats.ventasRemotas} Remota
                    </span>
                  </div>
                </button>

                {/* SEPARADOR */}
                <div className="my-2 2xl:my-3 w-px shrink-0 bg-slate-300" />

                {/* BOTÓN 2: VISITADOS */}
                <button
                  onClick={() => handleSectionClick('visitas')}
                  className={`flex flex-1 flex-col items-start justify-center px-4 2xl:px-8 py-2 2xl:py-3 text-center transition-colors cursor-pointer whitespace-nowrap ${
                    expandedSection === 'visitas'
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="mb-1 2xl:mb-1.5 flex items-baseline justify-center gap-1 2xl:gap-1.5">
                    <span className="text-lg 2xl:text-xl font-extrabold leading-none text-slate-800">
                      {stats.visitados.toLocaleString()}
                    </span>
                    <span className="text-[10px] 2xl:text-xs font-bold uppercase tracking-wider text-slate-500">
                      Visitados
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-[9px] 2xl:text-[11px] font-medium leading-tight">
                    <span className="font-bold text-emerald-600">
                      {stats.visitadosCompraron} Activos
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-center text-[9px] 2xl:text-[11px] font-medium leading-tight">
                    <span className="font-bold text-red-500">
                      {stats.visitadosNoCompraron} S/C
                    </span>
                  </div>
                </button>

                {/* SEPARADOR */}
                <div className="my-2 2xl:my-3 w-px shrink-0 bg-slate-300" />

                {/* BOTÓN 3: FINANZAS / VENDEDORES */}
                <button
                  onClick={() => handleSectionClick('finanzas')}
                  className={`flex flex-1 flex-col items-start justify-center px-4 2xl:px-8 py-2 2xl:py-3 text-center transition-colors rounded-tr-xl 2xl:rounded-tr-2xl cursor-pointer whitespace-nowrap ${
                    expandedSection === 'finanzas'
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="mb-1 2xl:mb-1.5 flex items-baseline justify-center gap-1.5 2xl:gap-2">
                    <span className="text-xs 2xl:text-sm font-extrabold leading-none text-slate-800">
                      MXN $
                      {stats.totalMXN.toLocaleString('es-MX', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    {stats.totalUSD > 0 && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs 2xl:text-sm font-extrabold leading-none text-slate-800">
                          USD $
                          {stats.totalUSD.toLocaleString('en-US', {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-[9px] 2xl:text-[11px] font-medium text-slate-500">
                    Ticket Promedio:{' '}
                    <span className="font-bold text-slate-700">
                      $
                      {stats.ticketPromedio.toLocaleString('es-MX', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </button>
              </div>

              {/* PANEL EXPANDIBLE INFERIOR */}
              <AnimatePresence>
                {expandedSection && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="w-full overflow-hidden"
                  >
                    <SummaryListWrapper>
                      {expandedSection === 'clientes' && (
                        <ClientSummaryList clients={stats.listaClientes} />
                      )}
                      {expandedSection === 'visitas' && (
                        <VisitsSummaryList visits={stats.listaVisitados} />
                      )}
                      {expandedSection === 'finanzas' && (
                        <VendorSummaryList vendors={stats.rankingVendedores} />
                      )}
                    </SummaryListWrapper>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
