// src/hooks/useVendors.ts
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Vendor {
  id: string;
  nombre: string;
}

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`${API_BASE_URL}/catalogos/vendedores`);
      if (response.ok) {
        const data = await response.json();
        setVendors(Array.isArray(data) ? data : []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error cargando vendedores:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return { vendors, loading, error, fetchVendors };
}
