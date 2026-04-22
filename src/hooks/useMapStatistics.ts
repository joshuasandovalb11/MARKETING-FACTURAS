import { useMemo } from 'react';
import type { Client } from '../types';

export interface MapStatistics {
  total: number;
  activos: number;
  inactivos: number;
  conversion: string;
  totalMXN: number;
  totalUSD: number;
  ticketPromedio: number;
  visitados: number;
  visitadosCompraron: number;
  visitadosNoCompraron: number;
  ventasCampo: number;
  ventasRemotas: number;
}

export function useMapStatistics(clients: Client[]) {
  return useMemo<MapStatistics>(() => {
    let total = 0;
    let activos = 0;
    let inactivos = 0;
    let totalMXN = 0;
    let totalUSD = 0;
    let visitados = 0;
    let ventasCampo = 0;
    let visitadosCompraron = 0;

    clients.forEach((client) => {
      total += 1;
      const marketingData = client.marketingData;

      if (marketingData?.status === 'activo') {
        activos += 1;
        totalMXN += marketingData.totalSpentMXN || 0;
        totalUSD += marketingData.totalSpentUSD || 0;
      } else {
        inactivos += 1;
      }

      const fueVisitado = marketingData?.visitadoEnPeriodo === true;
      const ventaEnCampo = marketingData?.ventaEnCampo === true;

      if (fueVisitado) {
        visitados += 1;
        if (marketingData?.status === 'activo') visitadosCompraron += 1;
      }

      if (ventaEnCampo && marketingData?.status === 'activo') {
        ventasCampo += 1;
      }
    });

    const conversion = total > 0 ? ((activos / total) * 100).toFixed(1) : '0.0';
    const ventasRemotas = activos - ventasCampo;
    const visitadosNoCompraron = visitados - visitadosCompraron;
    const ticketPromedio = activos > 0 ? totalMXN / activos : 0;

    return {
      total,
      activos,
      inactivos,
      conversion,
      totalMXN,
      totalUSD,
      ticketPromedio,
      visitados,
      visitadosCompraron,
      visitadosNoCompraron,
      ventasCampo,
      ventasRemotas,
    };
  }, [clients]);
}
