import type { QueryClient } from '@tanstack/react-query';
import {
  fetchAvailableDates,
  fetchGruposEmpresariales,
  fetchProveedores,
  fetchVendors,
} from '../services/catalogApi';
import { QUERY_TIMES } from './queryPolicies';

export async function warmupStaticCatalogs(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['availableDates'],
      queryFn: ({ signal }) => fetchAvailableDates(signal),
      staleTime: QUERY_TIMES.staticCatalogStale,
      gcTime: QUERY_TIMES.staticCatalogGc,
    }),
    queryClient.prefetchQuery({
      queryKey: ['vendors'],
      queryFn: ({ signal }) => fetchVendors(signal),
      staleTime: QUERY_TIMES.staticCatalogStale,
      gcTime: QUERY_TIMES.staticCatalogGc,
    }),
    queryClient.prefetchQuery({
      queryKey: ['proveedores'],
      queryFn: ({ signal }) => fetchProveedores(signal),
      staleTime: QUERY_TIMES.staticCatalogStale,
      gcTime: QUERY_TIMES.staticCatalogGc,
    }),
    queryClient.prefetchQuery({
      queryKey: ['grupos-empresariales'],
      queryFn: ({ signal }) => fetchGruposEmpresariales(signal),
      staleTime: QUERY_TIMES.staticCatalogStale,
      gcTime: QUERY_TIMES.staticCatalogGc,
    }),
  ]);
}
