import { useQuery } from '@tanstack/react-query';
import { fetchClientVisits } from '../services/marketingApi';
import type { Client, ClientVisitsResponse } from '../types';

interface UseClientVisitsProps {
  client: Client | null;
  filters: {
    startDate: string;
    endDate: string;
  };
}

export function useClientVisits({ client, filters }: UseClientVisitsProps) {
  const query = useQuery<ClientVisitsResponse | null>({
    queryKey: ['clientVisits', client?.id, filters.startDate, filters.endDate],
    queryFn: async () => {
      if (!client || !client.lat || !client.lng) return null;
      return fetchClientVisits({
        clientId: client.id,
        lat: client.lat,
        lng: client.lng,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    },
    enabled: !!client && !!client.lat && !!client.lng,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    visitsData: query.data,
    isLoadingVisits: query.isLoading,
    visitsError: query.error instanceof Error ? query.error.message : null,
    refetchVisits: query.refetch,
  };
}
