import { useQuery } from '@tanstack/react-query';
import { fetchAvailableDates } from '../services/catalogApi';
import { QUERY_RETRY, QUERY_TIMES } from '../utils/queryPolicies';
import { resolveErrorNotification } from '../utils/notificationPolicy';

export function useFechasDisponibles() {
  const { data, isLoading, isError, error, refetch } = useQuery<string[]>({
    queryKey: ['availableDates'],
    queryFn: async ({ signal }) => {
      const data = await fetchAvailableDates(signal);
      return data as string[];
    },
    staleTime: QUERY_TIMES.staticCatalogStale,
    gcTime: QUERY_TIMES.staticCatalogGc,
    retry: QUERY_RETRY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    select: (dates) => [...dates].sort(),
  });

  const availableDates: string[] = data ?? [];

  return {
    availableDates,
    loading: isLoading,
    error: isError,
    errorMessage: isError
      ? resolveErrorNotification({
          scope: 'dates-picker',
          error,
          fallback: 'No se pudieron cargar las fechas disponibles.',
        }).message
      : null,
    fetchFechas: refetch,
  };
}
