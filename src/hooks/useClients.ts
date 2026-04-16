// src/hooks/useClients.ts
import { useState, useCallback, useRef } from 'react';
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
  const requestSeqRef = useRef(0);

  const searchClients = useCallback(
    async (term: string) => {
      const normalizedTerm = term.trim();

      if (normalizedTerm.length < 2) {
        requestSeqRef.current += 1;
        setResults([]);
        setLoading(false);
        setError(false);
        setErrorMessage(null);
        return;
      }

      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;

      setLoading(true);
      setError(false);
      setErrorMessage(null);

      try {
        const data = await queryClient.fetchQuery({
          queryKey: ['clientSearch', normalizedTerm.toLowerCase()],
          queryFn: ({ signal }) => searchClientsByTerm(normalizedTerm, signal),
          staleTime: 1000 * 60 * 5,
        });

        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        setResults(data);
      } catch (err) {
        if (requestSeq !== requestSeqRef.current) {
          return;
        }

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
        if (requestSeq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [queryClient]
  );

  const clearResults = useCallback(() => {
    requestSeqRef.current += 1;
    setResults([]);
    setLoading(false);
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
