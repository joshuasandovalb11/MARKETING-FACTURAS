// src/hooks/useMarketingAnalysis.ts
import { useQuery } from '@tanstack/react-query';
import type { Client } from '../types';

interface UseMarketingAnalysisProps {
  filters: {
    startDate: string;
    endDate: string;
    vendor: string;
    idProveedor: string;
  };
  selectedClient: Client | null;
  hasActiveFilters: boolean;
}

export function useMarketingAnalysis({
  filters,
  selectedClient,
  hasActiveFilters,
}: UseMarketingAnalysisProps) {
  const { data, isLoading, error } = useQuery<Client[]>({
    queryKey: ['analysis', filters, selectedClient?.id],

    enabled: hasActiveFilters || !!selectedClient,

    staleTime: 1000 * 60 * 5,

    queryFn: async ({ signal }) => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const params: Record<string, string> = {};

      if (filters.startDate && filters.endDate) {
        params.fechaInicio = filters.startDate;
        params.fechaFin = filters.endDate;
      }
      if (filters.vendor && filters.vendor !== 'all') {
        params.vendedor = filters.vendor;
      }
      if (filters.idProveedor && filters.idProveedor !== 'all') {
        params.idProveedor = filters.idProveedor;
      }
      if (selectedClient) {
        const clientId =
          selectedClient.marketingData?.clienteId || selectedClient.id;
        params.idCliente = String(clientId);
        if (typeof selectedClient.idSucursal === 'number') {
          params.idSucursal = String(selectedClient.idSucursal);
        }
      }

      const queryParams = new URLSearchParams(params).toString();

      const response = await fetch(`${API_BASE_URL}/analisis?${queryParams}`, {
        signal,
      });

      if (!response.ok) throw new Error('Respuesta no exitosa del servidor');

      const rawData: Client[] = await response.json();

      const branchCountMap = new Map<string | number, number>();
      rawData.forEach((item: Client) => {
        const cId = item.marketingData?.clienteId || item.id;
        branchCountMap.set(cId, (branchCountMap.get(cId) || 0) + 1);
      });

      return rawData.map((item: Client) => {
        const marketingInfo = item.marketingData;
        const cId = marketingInfo?.clienteId || item.id;

        let finalBranchName = (item.branchName || '').trim();
        const isMatriz =
          finalBranchName.toLowerCase() === 'matriz' || finalBranchName === '';

        if (
          selectedClient &&
          String(cId) === String(selectedClient.marketingData?.clienteId)
        ) {
          if (String(item.id) === String(selectedClient.id)) {
            finalBranchName = selectedClient.branchName || '';
          }
        } else if (isMatriz) {
          const hasMultiple = (branchCountMap.get(cId) || 0) > 1;
          finalBranchName = hasMultiple ? 'Matriz' : '';
        }

        return {
          ...item,
          branchName: finalBranchName,
          marketingData: marketingInfo,
        };
      });
    },
  });

  return {
    mapClients: data || [],
    isDataLoading: isLoading,
    fetchError: error ? error.message : null,
  };
}
