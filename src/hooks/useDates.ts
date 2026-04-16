import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function useFechasDisponibles() {
  const { data, isLoading, isError, refetch } = useQuery<string[]>({
    queryKey: ['availableDates'],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/catalogos/fechas-disponibles`
      );
      if (!response.ok) throw new Error('Error al cargar fechas');
      const json = await response.json();
      return Array.isArray(json) ? json : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    availableDates: data || [],
    loading: isLoading,
    error: isError,
    fetchFechas: refetch,
  };
}
