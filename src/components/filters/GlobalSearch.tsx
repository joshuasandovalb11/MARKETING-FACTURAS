import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  Building2,
  Loader2,
  Search,
  Truck,
  UserRoundSearch,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Client, ApiSearchClient } from '../../types';
import { useClients } from '../../hooks/useClients';
import { useVendors } from '../../hooks/useVendors';
import { useProveedores } from '../../hooks/useProveedores';
import { useGruposEmpresariales } from '../../hooks/useGruposEmpresariales';
import { useNotificationToast } from '../../hooks/useNotificationToast';
import { resolveErrorMessageNotification } from '../../utils/notificationPolicy';

interface GlobalSearchProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  selectedVendor: string;
  selectedProveedores: string[];
  selectedGrupoEmpresarialIds: string[];
  onSelectVendor: (vendorId: string) => void;
  onSelectProveedor: (proveedorId: string, mode: 'add' | 'replace') => void;
  onSelectGrupoEmpresarial: (grupoId: string, mode: 'add' | 'replace') => void;
}

type SearchResultType = 'cliente' | 'vendedor' | 'proveedor' | 'grupo';

interface SearchResultItem {
  key: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  rank: number;
  payload: ApiSearchClient | { id: string; nombre: string };
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatClientDisplay(client: Client): string {
  const id = client.marketingData?.clienteId ?? client.id;
  const name = toTitleCase(client.name);
  return `#${id} ${name}`;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function scoreMatch(term: string, id: string, name: string): number {
  const t = normalizeText(term);
  const idText = normalizeText(id);
  const nameText = normalizeText(name);

  if (!t) return 99;
  if (idText === t) return 0;
  if (idText.startsWith(t)) return 1;
  if (nameText.startsWith(t)) return 2;
  if (idText.includes(t)) return 3;
  if (nameText.includes(t)) return 4;
  return 99;
}

export default function GlobalSearch({
  selectedClient,
  onSelectClient,
  selectedVendor,
  selectedProveedores,
  selectedGrupoEmpresarialIds,
  onSelectVendor,
  onSelectProveedor,
  onSelectGrupoEmpresarial,
}: GlobalSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { results, loading, error, errorMessage, searchClients, clearResults } =
    useClients();
  const {
    vendors,
    loading: vendorsLoading,
    error: vendorsError,
    errorMessage: vendorsErrorMessage,
  } = useVendors();
  const {
    proveedores,
    loading: proveedoresLoading,
    error: proveedoresError,
    errorMessage: proveedoresErrorMessage,
  } = useProveedores();
  const {
    gruposEmpresariales,
    loading: gruposLoading,
    error: gruposError,
    errorMessage: gruposErrorMessage,
  } = useGruposEmpresariales();

  const { notify } = useNotificationToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (isTypingRef.current) return;

    if (selectedClient) {
      setInputValue(formatClientDisplay(selectedClient));
    } else {
      setInputValue('');
    }
  }, [selectedClient]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!error || !errorMessage) return;

    notify(
      resolveErrorMessageNotification({
        scope: 'client-search',
        message: errorMessage,
        fallback: 'Error de conexion al buscar clientes.',
      })
    );
  }, [error, errorMessage, notify]);

  useEffect(() => {
    if (!vendorsError || !vendorsErrorMessage) return;

    notify(
      resolveErrorMessageNotification({
        scope: 'vendors-picker',
        message: vendorsErrorMessage,
        fallback: 'No se pudieron cargar los vendedores.',
      })
    );
  }, [vendorsError, vendorsErrorMessage, notify]);

  useEffect(() => {
    if (!proveedoresError || !proveedoresErrorMessage) return;

    notify(
      resolveErrorMessageNotification({
        scope: 'proveedores-picker',
        message: proveedoresErrorMessage,
        fallback: 'No se pudieron cargar los proveedores.',
      })
    );
  }, [proveedoresError, proveedoresErrorMessage, notify]);

  useEffect(() => {
    if (!gruposError || !gruposErrorMessage) return;

    notify(
      resolveErrorMessageNotification({
        scope: 'grupos-empresariales-picker',
        message: gruposErrorMessage,
        fallback: 'No se pudieron cargar los grupos empresariales.',
      })
    );
  }, [gruposError, gruposErrorMessage, notify]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        isTypingRef.current = false;

        if (selectedClient) {
          setInputValue(formatClientDisplay(selectedClient));
        } else {
          setInputValue('');
          clearResults();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedClient, clearResults]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      isTypingRef.current = true;
      setIsOpen(true);

      if (selectedClient) {
        onSelectClient(null);
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length < 2) {
        clearResults();
        return;
      }

      debounceRef.current = setTimeout(() => {
        searchClients(value.trim());
      }, 300);
    },
    [selectedClient, onSelectClient, clearResults, searchClients]
  );

  const buildClient = useCallback(
    (rawClient: ApiSearchClient): Client => {
      const id = rawClient.idCliente ?? rawClient.id;
      const hasMultiple =
        results.filter((r) => (r.idCliente ?? r.id) === id).length > 1;

      let sucursal = (rawClient.sucursal || rawClient.branchName || '').trim();
      const isMatriz = sucursal.toLowerCase() === 'matriz' || sucursal === '';

      if (isMatriz) {
        sucursal = hasMultiple ? 'Matriz' : '';
      }

      return {
        id: rawClient.id,
        name: rawClient.nombre || rawClient.name,
        branchName: sucursal,
        lat: rawClient.lat,
        lng: rawClient.lng,
        idSucursal: rawClient.idSucursal ?? 0,
        marketingData: {
          clienteId: rawClient.idCliente ?? rawClient.id,
          status: 'activo',
          totalSpentMXN: 0,
          totalSpentUSD: 0,
          ordersCount: 0,
          lastPurchase: null,
        },
      };
    },
    [results]
  );

  const handlePickResult = useCallback(
    (result: SearchResultItem, mode: 'add' | 'replace') => {
      isTypingRef.current = false;

      if (result.type === 'cliente') {
        const adaptedClient = buildClient(result.payload as ApiSearchClient);
        onSelectClient(adaptedClient);
        setInputValue(formatClientDisplay(adaptedClient));
      }

      if (result.type === 'vendedor') {
        const vendor = result.payload as { id: string; nombre: string };
        onSelectClient(null);
        onSelectVendor(vendor.id);
        setInputValue(`Vendedor: ${vendor.nombre}`);
      }

      if (result.type === 'proveedor') {
        const proveedor = result.payload as { id: string; nombre: string };
        onSelectClient(null);
        onSelectProveedor(proveedor.id, mode);
        setInputValue(`Proveedor: ${proveedor.nombre}`);
      }

      if (result.type === 'grupo') {
        const grupo = result.payload as { id: string; nombre: string };
        onSelectClient(null);
        onSelectGrupoEmpresarial(grupo.id, mode);
        setInputValue(`Grupo: ${grupo.nombre}`);
      }

      setIsOpen(false);
      clearResults();

      if (debounceRef.current) clearTimeout(debounceRef.current);
      inputRef.current?.blur();
    },
    [
      buildClient,
      clearResults,
      onSelectClient,
      onSelectGrupoEmpresarial,
      onSelectProveedor,
      onSelectVendor,
    ]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (debounceRef.current) clearTimeout(debounceRef.current);

      isTypingRef.current = false;
      onSelectClient(null);
      setInputValue('');
      setIsOpen(false);
      clearResults();
    },
    [onSelectClient, clearResults]
  );

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    if (selectedClient) {
      isTypingRef.current = true;
      setInputValue('');
      clearResults();
    }
  }, [selectedClient, clearResults]);

  const searchLen = inputValue.trim().length;
  const hasValue = inputValue.length > 0 || !!selectedClient;

  const handleRetry = useCallback(() => {
    const term = inputValue.trim();
    if (term.length >= 2) {
      searchClients(term);
    }
  }, [inputValue, searchClients]);

  const resultsByType = useMemo(() => {
    const term = inputValue.trim();
    const minReached = term.length >= 2;

    if (!minReached) {
      return {
        clientes: [] as SearchResultItem[],
        vendedores: [] as SearchResultItem[],
        proveedores: [] as SearchResultItem[],
        grupos: [] as SearchResultItem[],
        total: 0,
      };
    }

    const clienteItems = results
      .map((client, index) => {
        const id = String(client.idCliente ?? client.id);
        const nombre = toTitleCase(client.nombre || client.name || '');
        const sucursal = (client.sucursal || client.branchName || '').trim();
        const subtitle = sucursal
          ? `Cliente | ${toTitleCase(sucursal)}`
          : 'Cliente';

        return {
          key: `cliente-${client.id ?? id}-${index}`,
          type: 'cliente' as const,
          title: `#${id} ${nombre}`,
          subtitle,
          rank: scoreMatch(term, id, nombre),
          payload: client,
        };
      })
      .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
      .slice(0, 12);

    const vendorItems = vendors
      .map((vendor) => {
        const id = String(vendor.id);
        const nombre = vendor.nombre;
        return {
          key: `vendor-${id}`,
          type: 'vendedor' as const,
          title: nombre,
          subtitle: `Vendedor | ${id}${selectedVendor === id ? ' | Seleccionado' : ''}`,
          rank: scoreMatch(term, id, nombre),
          payload: { id, nombre },
        };
      })
      .filter((item) => item.rank < 99)
      .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
      .slice(0, 8);

    const proveedorSelectedSet = new Set(selectedProveedores.map(String));

    const proveedorItems = proveedores
      .map((proveedor) => {
        const id = String(proveedor.id);
        const nombre = proveedor.nombre;
        return {
          key: `proveedor-${id}`,
          type: 'proveedor' as const,
          title: nombre,
          subtitle: `Proveedor | ID ${id}${proveedorSelectedSet.has(id) ? ' | Seleccionado' : ''}`,
          rank: scoreMatch(term, id, nombre),
          payload: { id, nombre },
        };
      })
      .filter((item) => item.rank < 99)
      .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
      .slice(0, 8);

    const grupoSelectedSet = new Set(selectedGrupoEmpresarialIds.map(String));

    const grupoItems = gruposEmpresariales
      .map((grupo) => {
        const id = String(grupo.id);
        const nombre = grupo.nombre;
        return {
          key: `grupo-${id}`,
          type: 'grupo' as const,
          title: nombre,
          subtitle: `Grupo empresarial | ID ${id}${grupoSelectedSet.has(id) ? ' | Seleccionado' : ''}`,
          rank: scoreMatch(term, id, nombre),
          payload: { id, nombre },
        };
      })
      .filter((item) => item.rank < 99)
      .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
      .slice(0, 8);

    return {
      clientes: clienteItems,
      vendedores: vendorItems,
      proveedores: proveedorItems,
      grupos: grupoItems,
      total:
        clienteItems.length +
        vendorItems.length +
        proveedorItems.length +
        grupoItems.length,
    };
  }, [
    inputValue,
    gruposEmpresariales,
    proveedores,
    results,
    selectedGrupoEmpresarialIds,
    selectedProveedores,
    selectedVendor,
    vendors,
  ]);

  const showLoading =
    loading ||
    (searchLen >= 2 && (vendorsLoading || proveedoresLoading || gruposLoading));

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: SearchResultItem[]
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="p-1.5 flex flex-col gap-0.5">
        <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-100 mb-1 flex items-center gap-1.5">
          {icon}
          <span>
            {title} ({items.length})
          </span>
        </div>

        {items.map((item) => (
          <button
            key={item.key}
            onMouseDown={(e) => {
              e.preventDefault();
              const mode = e.altKey ? 'replace' : 'add';
              handlePickResult(item, mode);
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg flex flex-col justify-center bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-slate-800 truncate">
              {item.title}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 tracking-wide truncate mt-0.5">
              {item.subtitle}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative group w-full" ref={containerRef}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-full px-3 py-2 flex items-center justify-between text-sm transition-all cursor-text rounded-full border shadow-sm
          ${
            isOpen
              ? 'border-slate-400 ring-1 ring-slate-400'
              : 'ring-1 ring-slate-300 hover:border-slate-400'
          }
          ${
            selectedClient && !isTypingRef.current
              ? 'bg-white border-slate-300'
              : 'bg-white border-slate-200'
          }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <Search
            className={`w-4 h-4 shrink-0 transition-colors ${
              isOpen ? 'text-slate-700' : 'text-slate-400'
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar cliente, vendedor, proveedor o grupo..."
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            className="w-full bg-transparent outline-none p-0 truncate font-medium placeholder:font-normal placeholder:text-slate-400 text-slate-800"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {hasValue && (
          <div
            onClick={handleClear}
            className="ml-2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.97 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 mt-2 w-full min-w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 z-50 origin-top custom-scrollbar"
          >
            {showLoading && (
              <div className="p-10 flex justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {!showLoading && error && (
              <div className="p-6 flex flex-col items-center text-slate-600 text-xs text-center gap-2">
                <AlertCircle className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-sm">
                  {errorMessage || 'Error de conexion'}
                </span>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!showLoading &&
              !error &&
              searchLen >= 2 &&
              resultsByType.total > 0 && (
                <div>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 border-b border-slate-100">
                    Proveedor y grupo: click agrega, Alt+click reemplaza
                  </div>
                  {renderSection(
                    'Clientes',
                    <Search className="w-3 h-3" />,
                    resultsByType.clientes
                  )}
                  {renderSection(
                    'Vendedores',
                    <Users className="w-3 h-3" />,
                    resultsByType.vendedores
                  )}
                  {renderSection(
                    'Proveedores',
                    <Truck className="w-3 h-3" />,
                    resultsByType.proveedores
                  )}
                  {renderSection(
                    'Grupos empresariales',
                    <Building2 className="w-3 h-3" />,
                    resultsByType.grupos
                  )}
                </div>
              )}

            {!showLoading &&
              !error &&
              searchLen >= 2 &&
              resultsByType.total === 0 && (
                <div className="p-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                      <Search className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Sin coincidencias
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      No encontramos resultados para "{inputValue.trim()}".
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        Revisa ortografia
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        Intenta por ID
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        Usa menos texto
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {!showLoading && !error && searchLen < 2 && (
              <div className="p-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                    <UserRoundSearch className="h-4 w-4" />
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    Comienza tu busqueda
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Escribe 2 o mas caracteres para buscar en cliente, vendedor,
                    proveedor y grupo.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      Cliente
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      Vendedor
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      Proveedor
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      Grupo
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] font-medium text-slate-400">
                    Ej: 12045, Juan Perez, FANDELI, Grupo Zapata
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
