// src/hooks/useClientInvoices.ts
import { useQuery } from '@tanstack/react-query';
import type { Invoice } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UseClientInvoicesProps {
  clientId: string | number | undefined;
  idSucursal: number | undefined;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  idProveedor?: string;
}

export function useClientInvoices({
  clientId,
  idSucursal,
  startDate,
  endDate,
  isOpen,
  idProveedor,
}: UseClientInvoicesProps) {
  return useQuery<Invoice[]>({
    queryKey: [
      'invoices',
      clientId,
      idSucursal,
      startDate,
      endDate,
      idProveedor,
    ],
    enabled: isOpen && !!clientId,
    staleTime: 1000 * 60 * 5,

    queryFn: async () => {
      const params = new URLSearchParams();

      if (idSucursal !== undefined)
        params.append('idSucursal', String(idSucursal));
      if (startDate) params.append('fechaInicio', startDate);
      if (endDate) params.append('fechaFin', endDate);
      if (idProveedor) params.append('idProveedor', idProveedor);

      const response = await fetch(
        `${API_BASE_URL}/facturas/cliente/${clientId}?${params.toString()}`
      );

      if (!response.ok)
        throw new Error('Error al cargar el detalle de facturas');
      return response.json();
    },
  });
}
