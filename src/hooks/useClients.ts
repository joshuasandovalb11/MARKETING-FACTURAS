// src/hooks/useClients.ts
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ApiSearchClient } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function useClients() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState<ApiSearchClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const searchClients = useCallback(
    async (term: string) => {
      if (term.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const data = await queryClient.fetchQuery({
          queryKey: ['clientSearch', term],
          queryFn: async () => {
            const response = await fetch(
              `${API_BASE_URL}/clientes/buscar?q=${encodeURIComponent(term)}`
            );
            if (!response.ok) throw new Error('Error buscando clientes');
            return await response.json();
          },
          staleTime: 1000 * 60 * 5,
        });

        setResults(data);
      } catch (err) {
        console.error('Error buscando clientes:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [queryClient]
  );

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return { results, loading, error, searchClients, clearResults };
}
