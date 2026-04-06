// src/hooks/useDates.ts
import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function useFechasDisponibles() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFechas = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        `${API_BASE_URL}/catalogos/fechas-disponibles`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableDates(Array.isArray(data) ? data : []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error cargando fechas disponibles:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFechas();
  }, [fetchFechas]);

  return { availableDates, loading, error, fetchFechas };
}
