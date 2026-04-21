import { MapPin, Clock } from 'lucide-react';
import type { VisitaGPS } from '../../types';

interface VisitsTimelineProps {
  visitas: VisitaGPS[];
}

const formatSafeDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
};

const formatSafeTime = (timeStr: string) => {
  if (!timeStr) return '--:--';
  let timePart = timeStr;

  if (timeStr.includes('T')) {
    timePart = timeStr.split('T')[1];
  }

  const [hourRaw = '00', minuteRaw = '00'] = timePart.split(':');
  const hourNum = Number(hourRaw);
  const minute = minuteRaw.padStart(2, '0');

  const suffix = hourNum >= 12 ? 'pm' : 'am';
  const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;

  return `${String(hour12).padStart(2, '0')}:${minute} ${suffix}`;
};

export default function VisitsTimeline({ visitas }: VisitsTimelineProps) {
  if (!visitas || visitas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <MapPin className="w-7 h-7 mb-3" />
        <p className="text-xs font-medium">
          No hay visitas GPS en este rango de fechas
        </p>
      </div>
    );
  }

  const visitasAgrupadas = visitas.reduce(
    (acc, visita) => {
      const fechaCruda = visita.fecha.split('T')[0];
      if (!acc[fechaCruda]) acc[fechaCruda] = [];
      acc[fechaCruda].push(visita);
      return acc;
    },
    {} as Record<string, VisitaGPS[]>
  );

  return (
    <div className="py-4 space-y-6">
      {Object.entries(visitasAgrupadas).map(([fechaCruda, visitasDelDia]) => (
        <div key={fechaCruda} className="space-y-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4">
            {formatSafeDate(fechaCruda)}
          </p>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-linear-to-b from-blue-400 via-blue-300 to-blue-100 rounded-full" />

            <div className="space-y-4 ml-6 px-4">
              {visitasDelDia.map((visita, idx) => (
                <div key={idx} className="relative">
                  {/* TARJETA */}
                  <div className="border border-slate-200 rounded-lg px-3 py-2.5 bg-white shadow-sm hover:shadow-md transition-all">
                    {/* HORA Y DURACIÓN */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800">
                          {formatSafeTime(visita.horaLlegada)} -{' '}
                          {formatSafeTime(visita.horaSalida)}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600">
                        {visita.duracionMinutos} min
                      </span>
                    </div>

                    {/* PLACA Y VENDEDOR */}
                    <div className="flex items-center justify-between">
                      <div className="flex ml-6 items-center gap-2">
                        <span className="font-bold text-slate-800 text-[11px]">
                          {visita.placa || 'N/A'}
                        </span>
                      </div>
                      <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px]">
                        {visita.vendedorId || 'S/V'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
