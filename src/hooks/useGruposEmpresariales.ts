import { useQuery } from '@tanstack/react-query';
import {
  fetchGruposEmpresariales,
  type CatalogGrupoEmpresarial,
} from '../services/catalogApi';
import { QUERY_RETRY, QUERY_TIMES } from '../utils/queryPolicies';
import { resolveErrorNotification } from '../utils/notificationPolicy';

export type GrupoEmpresarial = CatalogGrupoEmpresarial;

export function useGruposEmpresariales() {
  const { data, isLoading, isError, error, refetch } = useQuery<
    GrupoEmpresarial[]
  >({
    queryKey: ['grupos-empresariales'],
    queryFn: ({ signal }) => fetchGruposEmpresariales(signal),
    staleTime: QUERY_TIMES.staticCatalogStale,
    gcTime: QUERY_TIMES.staticCatalogGc,
    retry: QUERY_RETRY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    select: (grupos) =>
      [...grupos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
  });

  return {
    gruposEmpresariales: data || [],
    loading: isLoading,
    error: isError,
    errorMessage: isError
      ? resolveErrorNotification({
          scope: 'grupos-empresariales-picker',
          error,
          fallback: 'No se pudieron cargar los grupos empresariales.',
        }).message
      : null,
    fetchGruposEmpresariales: refetch,
  };
}
