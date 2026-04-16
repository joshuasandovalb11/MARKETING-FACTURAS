// src/hooks/useMarketingAnalysis.ts
import { useQuery } from '@tanstack/react-query';
import type { Client } from '../types';
import { buildAsyncViewState } from '../utils/asyncViewState';
import {
  buildAnalysisQueryKey,
  QUERY_RETRY,
  QUERY_TIMES,
} from '../utils/queryPolicies';
import { fetchMarketingAnalysis } from '../services/marketingApi';
import { resolveErrorNotification } from '../utils/notificationPolicy';

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
  const isQueryEnabled = hasActiveFilters || !!selectedClient;
  const selectedClientKey =
    selectedClient?.marketingData?.clienteId ?? selectedClient?.id ?? null;
  const selectedBranchKey =
    selectedClient?.idSucursal ?? selectedClient?.id ?? null;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
    Client[]
  >({
    queryKey: buildAnalysisQueryKey({
      startDate: filters.startDate,
      endDate: filters.endDate,
      vendor: filters.vendor,
      idProveedor: filters.idProveedor,
      selectedClientKey,
      selectedBranchKey,
    }),

    enabled: isQueryEnabled,

    staleTime: QUERY_TIMES.analysisStale,
    gcTime: QUERY_TIMES.analysisGc,
    retry: QUERY_RETRY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,

    queryFn: async ({ signal }) => {
      const rawData: Client[] = await fetchMarketingAnalysis({
        startDate: filters.startDate,
        endDate: filters.endDate,
        vendor: filters.vendor,
        idProveedor: filters.idProveedor,
        selectedClient,
        signal,
      });

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
          const selectedSucursal = selectedClient.idSucursal;
          const itemSucursal = item.idSucursal;

          const isSelectedBranch =
            typeof selectedSucursal === 'number' &&
            typeof itemSucursal === 'number'
              ? String(itemSucursal) === String(selectedSucursal)
              : String(item.id) === String(selectedClient.id);

          if (isSelectedBranch) {
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

  const mapClients = data || [];
  const hasData = mapClients.length > 0;
  const analysisViewState = buildAsyncViewState({
    enabled: isQueryEnabled,
    hasData,
    isLoading,
    isFetching,
    isError,
  });

  return {
    mapClients,
    analysisViewState,
    isInitialLoading: analysisViewState === 'loading-initial',
    isRefreshing: analysisViewState === 'loading-refresh',
    isEmpty: analysisViewState === 'success-empty',
    hasData,
    hasError: analysisViewState === 'error-recoverable',
    fetchError: error
      ? resolveErrorNotification({
          scope: 'analysis-map',
          error,
          fallback: 'No se pudo cargar el analisis de clientes.',
        }).message
      : null,
    refetchAnalysis: refetch,
  };
}
