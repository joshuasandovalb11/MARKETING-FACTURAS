import { useMemo } from 'react';
import type { Client } from '../types';

export interface ClientDetail {
  id: string;
  nombre: string;
  sucursal: string;
  status: 'activo' | 'sin_compra';
  ventaMXN: number;
  ventaUSD: number;
  ventaEnCampo: boolean;
  fueVisitado: boolean;
  vendedor: string;
}

export interface VendorSummary {
  vendedor: string;
  clientes: number;
  activos: number;
  ventaMXN: number;
  ventaUSD: number;
  ticketPromedio: number;
}

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
  listaClientes: ClientDetail[];
  listaVisitados: ClientDetail[];
  rankingVendedores: VendorSummary[];
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

    const listaClientes: ClientDetail[] = [];
    const listaVisitados: ClientDetail[] = [];
    const vendorsMap = new Map<string, VendorSummary>();

    clients.forEach((client) => {
      total += 1;
      const marketingData = client.marketingData;

      const vMXN = marketingData?.totalSpentMXN || 0;
      const vUSD = marketingData?.totalSpentUSD || 0;
      const statusVenta =
        marketingData?.status === 'activo' ? 'activo' : 'sin_compra';
      const fueVisitado = marketingData?.visitadoEnPeriodo === true;
      const ventaEnCampo = marketingData?.ventaEnCampo === true;
      const vendedorStr = client.vendor || 'S/V';

      if (statusVenta === 'activo') {
        activos += 1;
        totalMXN += vMXN;
        totalUSD += vUSD;
      } else {
        inactivos += 1;
      }

      if (fueVisitado) {
        visitados += 1;
        if (statusVenta === 'activo') visitadosCompraron += 1;
      }

      if (ventaEnCampo && statusVenta === 'activo') {
        ventasCampo += 1;
      }

      const clientDetail: ClientDetail = {
        id: client.id.toString(),
        nombre: client.name || 'Cliente sin nombre',
        sucursal: client.branchName || '',
        status: statusVenta,
        ventaMXN: vMXN,
        ventaUSD: vUSD,
        ventaEnCampo,
        fueVisitado,
        vendedor: vendedorStr,
      };

      listaClientes.push(clientDetail);
      if (fueVisitado) {
        listaVisitados.push(clientDetail);
      }

      if (!vendorsMap.has(vendedorStr)) {
        vendorsMap.set(vendedorStr, {
          vendedor: vendedorStr,
          clientes: 0,
          activos: 0,
          ventaMXN: 0,
          ventaUSD: 0,
          ticketPromedio: 0,
        });
      }
      const vStats = vendorsMap.get(vendedorStr)!;
      vStats.clientes += 1;
      if (statusVenta === 'activo') {
        vStats.activos += 1;
        vStats.ventaMXN += vMXN;
        vStats.ventaUSD += vUSD;
      }
    });

    const conversion = total > 0 ? ((activos / total) * 100).toFixed(1) : '0.0';
    const ventasRemotas = activos - ventasCampo;
    const visitadosNoCompraron = visitados - visitadosCompraron;
    const ticketPromedio = activos > 0 ? totalMXN / activos : 0;

    vendorsMap.forEach((v) => {
      v.ticketPromedio = v.activos > 0 ? v.ventaMXN / v.activos : 0;
    });

    const sortClients = (a: ClientDetail, b: ClientDetail) => {
      if (a.status === 'activo' && b.status !== 'activo') return -1;
      if (b.status === 'activo' && a.status !== 'activo') return 1;
      return b.ventaMXN - a.ventaMXN;
    };

    listaClientes.sort(sortClients);
    listaVisitados.sort(sortClients);
    const rankingVendedores = Array.from(vendorsMap.values()).sort(
      (a, b) => b.ventaMXN - a.ventaMXN
    );

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
      listaClientes,
      listaVisitados,
      rankingVendedores,
    };
  }, [clients]);
}
