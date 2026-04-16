// src/hooks/useClients.ts
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ApiSearchClient } from '../types';
import { searchClientsByTerm } from '../services/clientApi';
import { resolveErrorNotification } from '../utils/notificationPolicy';

export function useClients() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState<ApiSearchClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchClients = useCallback(
    async (term: string) => {
      if (term.trim().length < 2) {
        setResults([]);
        setError(false);
        setErrorMessage(null);
        return;
      }

      setLoading(true);
      setError(false);
      setErrorMessage(null);

      try {
        const data = await queryClient.fetchQuery({
          queryKey: ['clientSearch', term],
          queryFn: ({ signal }) => searchClientsByTerm(term, signal),
          staleTime: 1000 * 60 * 5,
        });

        setResults(data);
      } catch (err) {
        console.error('Error buscando clientes:', err);
        setError(true);
        setErrorMessage(
          resolveErrorNotification({
            scope: 'client-search',
            error: err,
            fallback: 'Error de conexion al buscar clientes.',
          }).message
        );
      } finally {
        setLoading(false);
      }
    },
    [queryClient]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(false);
    setErrorMessage(null);
  }, []);

  return {
    results,
    loading,
    error,
    errorMessage,
    searchClients,
    clearResults,
  };
}
