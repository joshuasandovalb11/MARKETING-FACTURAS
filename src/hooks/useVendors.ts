import { useQuery } from '@tanstack/react-query';
import { fetchVendors, type CatalogVendor } from '../services/catalogApi';
import { QUERY_RETRY, QUERY_TIMES } from '../utils/queryPolicies';
import { resolveErrorNotification } from '../utils/notificationPolicy';

export type Vendor = CatalogVendor;

export function useVendors() {
  const { data, isLoading, isError, error, refetch } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: ({ signal }) => fetchVendors(signal),
    staleTime: QUERY_TIMES.staticCatalogStale,
    gcTime: QUERY_TIMES.staticCatalogGc,
    retry: QUERY_RETRY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    select: (vendors) =>
      [...vendors].sort((a, b) => a.nombre.localeCompare(b.nombre)),
  });

  return {
    vendors: data || [],
    loading: isLoading,
    error: isError,
    errorMessage: isError
      ? resolveErrorNotification({
          scope: 'vendors-picker',
          error,
          fallback: 'No se pudieron cargar los vendedores.',
        }).message
      : null,
    fetchVendors: refetch,
  };
}
