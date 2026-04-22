// src/types/index.ts
export interface MarketingData {
  clienteId: string | number;
  totalSpentMXN: number;
  totalSpentUSD: number;
  ordersCount: number;
  lastPurchase: string | null;
  status: 'activo' | 'sin_compra';
  visitadoEnPeriodo?: boolean;
  ventaEnCampo?: boolean;
}

export interface Client {
  id: string | number;
  name: string;
  branchName?: string | null;
  lat: number;
  lng: number;
  vendor?: string;
  idSucursal?: number;
  giroComercial?: string | null;
  marketingData?: MarketingData;
}

export interface ApiSearchClient {
  id: string | number;
  name: string;
  idCliente?: string | number;
  idSucursal?: number;
  nombre?: string;
  sucursal?: string;
  branchName?: string;
  lat: number;
  lng: number;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  vendor: string;
  status: string;
  idZona: string;
  idMarca: string;
  idProveedorIds: string[];
  idProducto: string;
  agruparSucursales: boolean;
  convertirAMXN: boolean;
  excluirCanceladas: boolean;
  soloConVentas: boolean;
}

export interface InvoiceItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  totalLinea: number;
  proveedor: string;
}

export interface Invoice {
  idFactura: string | number;
  fecha: string;
  total: number;
  moneda: string;
  articulos: InvoiceItem[];
  proveedoresUnicos: string[];
}

export interface VisitaGPS {
  fecha: string;
  vendedorId: string;
  placa: string;
  horaLlegada: string;
  horaSalida: string;
  duracionMinutos: number;
  distanciaMetros: number;
}

export interface UltimaVisita {
  fecha: string;
  id_vendedor: string;
}

export interface ClientVisitsResponse {
  historialVisitas: VisitaGPS[];
  ultimaVisitaAbsoluta: UltimaVisita | null;
}
