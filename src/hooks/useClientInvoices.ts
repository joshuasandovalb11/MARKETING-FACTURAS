// src/hooks/useClientInvoices.ts
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const clientKey = clientId ?? null;
  const queryKey = buildInvoiceQueryKey({
    clientKey,
    idSucursal,
    startDate,
    endDate,
    idProveedor,
  });

  useEffect(() => {
    if (isOpen) return;

    void queryClient.cancelQueries({ queryKey });
  }, [isOpen, queryClient, queryKey]);

  return useQuery<Invoice[]>({
    queryKey,
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
