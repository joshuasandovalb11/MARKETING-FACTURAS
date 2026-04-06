// src/hooks/useProveedores.ts
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Proveedor {
  id: string;
  nombre: string;
}

export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProveedores = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`${API_BASE_URL}/catalogos/proveedores`);
      if (response.ok) {
        const data = await response.json();
        setProveedores(Array.isArray(data) ? data : []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error cargando proveedores:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  return { proveedores, loading, error, fetchProveedores };
}
