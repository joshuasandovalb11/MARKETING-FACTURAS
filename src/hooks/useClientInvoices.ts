// src/hooks/useClientInvoices.ts
import { useQuery } from '@tanstack/react-query';
import type { Invoice } from '../types';
import {
  buildInvoiceQueryKey,
  QUERY_RETRY,
  QUERY_TIMES,
} from '../utils/queryPolicies';
import { fetchClientInvoices } from '../services/marketingApi';

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
  const clientKey = clientId ?? null;

  return useQuery<Invoice[]>({
    queryKey: buildInvoiceQueryKey({
      clientKey,
      idSucursal,
      startDate,
      endDate,
      idProveedor,
    }),
    enabled: isOpen && !!clientId,
    staleTime: QUERY_TIMES.invoicesStale,
    gcTime: QUERY_TIMES.invoicesGc,
    retry: QUERY_RETRY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,

    queryFn: ({ signal }) =>
      fetchClientInvoices({
        clientId: clientId as string | number,
        idSucursal,
        startDate,
        endDate,
        idProveedor,
        signal,
      }),
  });
}
