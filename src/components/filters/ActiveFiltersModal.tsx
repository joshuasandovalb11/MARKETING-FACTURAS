import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Client } from '../../types';
import type { Vendor } from '../../hooks/useVendors';
import type { Proveedor } from '../../hooks/useProveedores';
import type { GrupoEmpresarial } from '../../hooks/useGruposEmpresariales';

interface ActiveFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: Client | null;
  startDate: string;
  endDate: string;
  vendor: string;
  status: string;
  idProveedorIds: string[];
  idGrupoEmpresarialIds: string[];
  vendors: Vendor[];
  proveedores: Proveedor[];
  gruposEmpresariales: GrupoEmpresarial[];
  onClearClient: () => void;
  onClearDateRange: () => void;
  onClearVendor: () => void;
  onClearStatus: () => void;
  onClearProveedor: (proveedorId: string) => void;
  onClearGrupo: (grupoId: string) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function getVendorName(vendorId: string, vendors: Vendor[]): string {
  const vendor = vendors.find((v) => String(v.id) === String(vendorId));
  return vendor?.nombre || vendorId;
}

function getProveedorName(
  proveedorId: string,
  proveedores: Proveedor[]
): string {
  const proveedor = proveedores.find(
    (p) => String(p.id) === String(proveedorId)
  );
  return proveedor?.nombre || proveedorId;
}

function getGrupoName(
  grupoId: string,
  gruposEmpresariales: GrupoEmpresarial[]
): string {
  const grupo = gruposEmpresariales.find(
    (g) => String(g.id) === String(grupoId)
  );
  return grupo?.nombre || grupoId;
}

function getStatusLabel(status: string): string {
  if (status === 'active') return 'Activo';
  if (status === 'inactive') return 'Sin Compra';
  return status;
}

export default function ActiveFiltersModal({
  isOpen,
  onClose,
  selectedClient,
  startDate,
  endDate,
  vendor,
  status,
  idProveedorIds,
  idGrupoEmpresarialIds,
  vendors,
  proveedores,
  gruposEmpresariales,
  onClearClient,
  onClearDateRange,
  onClearVendor,
  onClearStatus,
  onClearProveedor,
  onClearGrupo,
}: ActiveFiltersModalProps) {
  const renderChip = (
    label: string,
    onClear: () => void,
    icon?: React.ReactNode
  ) => (
    <div
      key={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
    >
      {icon && <span className="text-slate-500">{icon}</span>}
      <span>{label}</span>
      <button
        onClick={onClear}
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
        title="Limpiar filtro"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.12 }}
            className="fixed left-5 top-28 z-50 w-80 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-lg"
          >
            <div className="border-b bg-white border-slate-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Filtros Aplicados
              </h3>
              <button
                onClick={onClose}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex max-h-55 flex-wrap gap-2 overflow-y-auto p-3 custom-scrollbar">
              {/* Cliente */}
              {selectedClient &&
                renderChip(
                  toTitleCase(
                    `Cliente: #${selectedClient.marketingData?.clienteId || selectedClient.id} ${selectedClient.name}`
                  ),
                  onClearClient
                )}

              {/* Fecha */}
              {startDate &&
                endDate &&
                renderChip(
                  `Fecha: ${formatDate(startDate)} - ${formatDate(endDate)}`,
                  onClearDateRange
                )}

              {/* Vendedor */}
              {vendor &&
                renderChip(
                  toTitleCase(`Vendedor: ${getVendorName(vendor, vendors)}`),
                  onClearVendor
                )}

              {/* Estado */}
              {status &&
                status !== 'all' &&
                renderChip(`Estado: ${getStatusLabel(status)}`, onClearStatus)}

              {/* Proveedores */}
              {idProveedorIds.length > 0 && (
                <>
                  {idProveedorIds.map((provId) =>
                    renderChip(
                      toTitleCase(
                        `Proveedor: ${getProveedorName(provId, proveedores)}`
                      ),
                      () => onClearProveedor(provId)
                    )
                  )}
                </>
              )}

              {/* Grupos */}
              {idGrupoEmpresarialIds.length > 0 && (
                <>
                  {idGrupoEmpresarialIds.map((grupoId) =>
                    renderChip(
                      toTitleCase(
                        `Grupo: ${getGrupoName(grupoId, gruposEmpresariales)}`
                      ),
                      () => onClearGrupo(grupoId)
                    )
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
