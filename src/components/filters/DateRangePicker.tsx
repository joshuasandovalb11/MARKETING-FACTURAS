/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useFechasDisponibles } from '../../hooks/useDates';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
  onClear: () => void;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export default function DateRangePicker({
  startDate,
  endDate,
  onApply,
  onClear,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    availableDates,
    loading: datesLoading,
    error,
    fetchFechas,
  } = useFechasDisponibles();

  const [positionConfig, setPositionConfig] = useState<any>({
    style: { position: 'fixed', top: '-9999px', left: '-9999px' },
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  });

  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [viewDate, setViewDate] = useState(new Date());

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const SAFETY_MARGIN = 10;
    const MODAL_WIDTH = 320;

    let newConfig: any = {};

    if (viewportWidth < 768) {
      newConfig = {
        style: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '90vw',
          maxWidth: '340px',
          maxHeight: '85vh',
          transform: 'translate(-50%, -50%)',
          overflowY: 'auto',
          zIndex: 9999,
        },
        initial: { opacity: 0, scale: 0.95, x: '-50%', y: '-40%' },
        animate: { opacity: 1, scale: 1, x: '-50%', y: '-50%' },
        exit: { opacity: 0, scale: 0.95, x: '-50%', y: '-40%' },
      };
    } else {
      const spaceBelow = viewportHeight - rect.bottom - SAFETY_MARGIN;
      const spaceAbove = rect.top - SAFETY_MARGIN;
      const contentHeightEstim = 400;

      let verticalStyle: React.CSSProperties = {};
      let origin = 'center';

      if (spaceBelow < contentHeightEstim && spaceAbove > spaceBelow) {
        verticalStyle = {
          bottom: viewportHeight - rect.top + 8,
          maxHeight: spaceAbove,
        };
        origin = 'bottom left';
      } else {
        verticalStyle = {
          top: rect.bottom + 8,
          maxHeight: spaceBelow,
        };
        origin = 'top left';
      }

      newConfig = {
        style: {
          position: 'fixed',
          left: rect.left,
          width: `${MODAL_WIDTH}px`,
          overflowY: 'auto',
          zIndex: 9999,
          ...verticalStyle,
        },
        initial: { opacity: 0, scale: 0.95, transformOrigin: origin },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      };
    }

    setPositionConfig(newConfig);
  };

  const toggleOpen = () => {
    if (!isOpen) {
      setTempStart(startDate);
      setTempEnd(endDate);
      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        setViewDate(new Date(y, m - 1, d));
      } else {
        setViewDate(new Date());
      }
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, { capture: true });
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const handlePrevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleDateClick = (dateStr: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd('');
    } else {
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const selectAllDates = () => {
    onClear();
    setIsOpen(false);
  };

  const applySelection = () => {
    if (tempStart) {
      onApply(tempStart, tempEnd || tempStart);
      setIsOpen(false);
    }
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];

    for (let i = 0; i < startOffset; i++)
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);

    for (let d = 1; d <= daysInMonth; d++) {
      const dayString = d < 10 ? `0${d}` : `${d}`;
      const monthString = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
      const fullDate = `${year}-${monthString}-${dayString}`;

      let isSelected = false;
      let isRange = false;
      let isRangeStart = false;
      let isRangeEnd = false;

      if (tempStart && tempEnd) {
        if (fullDate >= tempStart && fullDate <= tempEnd) isRange = true;
        if (fullDate === tempStart) isRangeStart = true;
        if (fullDate === tempEnd) isRangeEnd = true;
      } else if (tempStart && fullDate === tempStart) {
        isSelected = true;
      }

      const hasDatesFromDB = availableDates?.length > 0;
      const isAvailable =
        !datesLoading && hasDatesFromDB
          ? availableDates.includes(fullDate)
          : true;

      days.push(
        <button
          key={fullDate}
          onClick={() => handleDateClick(fullDate)}
          disabled={!isAvailable}
          className={`
            h-8 w-full flex items-center justify-center text-xs font-medium rounded-md transition-colors relative 
            ${!isAvailable ? 'cursor-not-allowed opacity-30 line-through' : 'cursor-pointer'}
            ${isSelected ? 'bg-slate-900 text-white font-semibold z-10 line-through-none opacity-100' : ''}
            ${!isSelected && isAvailable ? 'text-slate-700 hover:bg-slate-100' : ''}
            ${isRange && !isRangeStart && !isRangeEnd ? 'bg-slate-100 text-slate-800 rounded-none line-through-none opacity-100' : ''}
            ${isRangeStart ? 'bg-slate-900 text-white hover:bg-slate-500 rounded-r-none z-10 line-through-none opacity-100' : ''}
            ${isRangeEnd ? 'bg-slate-900 text-white hover:bg-slate-500  rounded-l-none z-10 line-through-none opacity-100' : ''}
            ${isRangeStart && isRangeEnd ? 'rounded-md line-through-none opacity-100' : ''} 
          `}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const buttonText =
    startDate && endDate
      ? `${startDate} ➜ ${endDate}`
      : startDate
        ? startDate
        : 'Seleccionar Fechas';
  const isActive = !!startDate || !!endDate;

  return (
    <>
      <div className="relative w-auto min-w-56">
        <button
          ref={buttonRef}
          onClick={toggleOpen}
          className={`w-full px-3 py-2 flex items-center justify-between text-sm transition-all cursor-pointer rounded-md border shadow-sm
          ${isOpen ? 'border-slate-300 ring-1 ring-slate-300' : 'hover:border-slate-300'}
          ${isActive ? 'bg-white border-slate-300 text-slate-900 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <CalendarRange
              className={`w-4 h-4 shrink-0 ${isOpen ? 'text-slate-600' : 'text-slate-400'} ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
            />
            <span className="truncate">{buttonText}</span>
          </div>

          {isActive ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="ml-2 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div
              className={`ml-2 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-600' : ''}`}
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </div>
          )}
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] pointer-events-auto"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              {...positionConfig}
              className="fixed bg-white rounded-lg shadow-lg border border-slate-200 p-4 pointer-events-auto flex flex-col min-h-62.5"
              style={{ ...positionConfig.style }}
            >
              {/* ESTADO DE CARGA */}
              {datesLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-medium">
                    Sincronizando fechas...
                  </span>
                </div>
              ) : /* ESTADO DE ERROR */
              error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-xs text-center gap-3">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                  <span className="font-medium text-sm">Error de conexión</span>
                  <p className="text-slate-500 max-w-50">
                    No se pudieron cargar las fechas disponibles.
                  </p>
                  {fetchFechas && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchFechas();
                      }}
                      className="flex text-xs font-medium items-center gap-1.5 px-4 py-2 mt-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md cursor-pointer shadow-sm transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reintentar</span>
                    </button>
                  )}
                </div>
              ) : (
                /* CALENDARIO NORMAL */
                <>
                  <button
                    onClick={selectAllDates}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 mb-4 rounded-md text-xs font-medium transition-colors border ${
                      !isActive
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                    }`}
                    disabled={!isActive}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Limpiar Filtro</span>
                  </button>

                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-slate-800 capitalize">
                      {MONTH_NAMES[viewDate.getMonth()]}{' '}
                      {viewDate.getFullYear()}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 mb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(
                      (day) => (
                        <div
                          key={day}
                          className="h-6 flex items-center justify-center text-[10px] font-medium text-slate-400 uppercase"
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 mb-5">
                    {renderDays()}
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex justify-between items-center text-xs px-1">
                      <span className="text-slate-500">Selección:</span>
                      <span className="font-medium text-slate-800">
                        {tempStart ? tempStart : '--'}
                        {tempEnd && tempEnd !== tempStart
                          ? ` a ${tempEnd}`
                          : ''}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent rounded-md transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={applySelection}
                        disabled={!tempStart}
                        className="flex-1 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>,
          document.body
        )}
    </>
  );
}
