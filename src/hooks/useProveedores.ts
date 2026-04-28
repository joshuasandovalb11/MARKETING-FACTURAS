import { useQuery } from '@tanstack/react-query';
import {
  fetchProveedores,
  type CatalogProveedor,
} from '../services/catalogApi';
import { QUERY_RETRY, QUERY_TIMES } from '../utils/queryPolicies';
import { resolveErrorNotification } from '../utils/notificationPolicy';

export type Proveedor = CatalogProveedor;

export function useProveedores() {
  const { data, isLoading, isError, error, refetch } = useQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: ({ signal }) => fetchProveedores(signal),
    staleTime: QUERY_TIMES.staticCatalogStale,
    gcTime: QUERY_TIMES.staticCatalogGc,
    retry: QUERY_RETRY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select: (proveedores) =>
      [...proveedores].sort((a, b) => a.nombre.localeCompare(b.nombre)),
  });

  return {
    proveedores: data || [],
    loading: isLoading,
    error: isError,
    errorMessage: isError
      ? resolveErrorNotification({
          scope: 'proveedores-picker',
          error,
          fallback: 'No se pudieron cargar los proveedores.',
        }).message
      : null,
    fetchProveedores: refetch,
  };
}
