import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Proveedor {
  id: string;
  nombre: string;
}

export function useProveedores() {
  const { data, isLoading, isError, refetch } = useQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/catalogos/proveedores`);
      if (!response.ok) throw new Error('Error al cargar proveedores');
      const json = await response.json();
      return Array.isArray(json) ? json : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    proveedores: data || [],
    loading: isLoading,
    error: isError,
    fetchProveedores: refetch,
  };
}
