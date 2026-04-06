// src/hooks/useClients.ts
import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function useClients() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const searchClients = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/clientes/buscar?q=${encodeURIComponent(term)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error buscando clientes:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return { results, loading, error, searchClients, clearResults };
}
