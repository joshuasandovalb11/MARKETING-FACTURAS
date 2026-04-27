import type { Client } from '../../types';

interface ActiveFilterCountProps {
  selectedClient: Client | null;
  startDate: string;
  endDate: string;
  vendor: string;
  status: string;
  idProveedorIds: string[];
  idGrupoEmpresarialIds: string[];
}

export function countActiveFilters({
  selectedClient,
  startDate,
  endDate,
  vendor,
  status,
  idProveedorIds,
  idGrupoEmpresarialIds,
}: ActiveFilterCountProps): number {
  let count = 0;

  if (selectedClient) count += 1;
  if (startDate && endDate) count += 1;
  if (vendor) count += 1;
  if (status && status !== 'all') count += 1;
  if (idProveedorIds.length > 0) count += idProveedorIds.length;
  if (idGrupoEmpresarialIds.length > 0) count += idGrupoEmpresarialIds.length;

  return count;
}
