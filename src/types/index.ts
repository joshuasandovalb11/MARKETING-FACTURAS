// src/types/index.ts
export interface MarketingData {
  clienteId: string | number;
  totalSpentMXN: number;
  totalSpentUSD: number;
  ordersCount: number;
  lastPurchase: string | null;
  status: 'activo' | 'sin_compra';
}

export interface Client {
  id: string | number;
  name: string;
  branchName?: string | null;
  lat: number;
  lng: number;
  vendor?: string;
  idSucursal?: number;
  marketingData?: MarketingData;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  vendor: string;
  status: string;
  idZona: string;
  idMarca: string;
  idProveedor: string;
  idProducto: string;
  agruparSucursales: boolean;
  convertirAMXN: boolean;
  excluirCanceladas: boolean;
  soloConVentas: boolean;
}
