import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Vendor {
  id: string;
  nombre: string;
}

export function useVendors() {
  const { data, isLoading, isError, refetch } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/catalogos/vendedores`);
      if (!response.ok) throw new Error('Error al cargar vendedores');
      const json = await response.json();
      return Array.isArray(json) ? json : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    vendors: data || [],
    loading: isLoading,
    error: isError,
    fetchVendors: refetch,
  };
}
