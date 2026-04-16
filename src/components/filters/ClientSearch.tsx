// src/components/filters/ClientSearch.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Loader2, Search, UserRoundSearch, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Client, ApiSearchClient } from '../../types';
import { useClients } from '../../hooks/useClients';
import { useNotificationToast } from '../../hooks/useNotificationToast';
import { resolveErrorMessageNotification } from '../../utils/notificationPolicy';

interface ClientSearchProps {
  onSelect: (client: Client | null) => void;
  selectedClient: Client | null;
}

function formatClientDisplay(client: Client): string {
  const id = client.marketingData?.clienteId ?? client.id;
  const name = toTitleCase(client.name);
  return `#${id} ${name}`;
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ClientSearch({
  onSelect,
  selectedClient,
}: ClientSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { results, loading, error, errorMessage, searchClients, clearResults } =
    useClients();
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
        onSelect(null);
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length < 2) {
        clearResults();
        return;
      }

      debounceRef.current = setTimeout(() => {
        searchClients(value.trim());
      }, 350);
    },
    [selectedClient, onSelect, clearResults, searchClients]
  );

  const handleSelect = useCallback(
    (rawClient: ApiSearchClient) => {
      const id = rawClient.idCliente ?? rawClient.id;

      const hasMultiple =
        results.filter((r) => (r.idCliente ?? r.id) === id).length > 1;

      let sucursal = (rawClient.sucursal || rawClient.branchName || '').trim();
      const isMatriz = sucursal.toLowerCase() === 'matriz' || sucursal === '';

      if (isMatriz) {
        sucursal = hasMultiple ? 'Matriz' : '';
      }

      const adaptedClient: Client = {
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
      isTypingRef.current = false;

      onSelect(adaptedClient);
      setInputValue(formatClientDisplay(adaptedClient));
      setIsOpen(false);
      clearResults();

      if (debounceRef.current) clearTimeout(debounceRef.current);
      inputRef.current?.blur();
    },
    [onSelect, clearResults, results]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (debounceRef.current) clearTimeout(debounceRef.current);

      isTypingRef.current = false;
      onSelect(null);
      setInputValue('');
      setIsOpen(false);
      clearResults();
    },
    [onSelect, clearResults]
  );

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    if (selectedClient) {
      isTypingRef.current = true;
      setInputValue('');
      clearResults();
    }
  }, [selectedClient, clearResults]);

  const hasValue = inputValue.length > 0 || !!selectedClient;
  const searchLen = inputValue.trim().length;

  const handleRetry = useCallback(() => {
    const term = inputValue.trim();
    if (term.length >= 2) {
      searchClients(term);
    }
  }, [inputValue, searchClients]);

  return (
    <div className="relative group w-full" ref={containerRef}>
      {/* Input trigger */}
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
            placeholder="Buscar por nombre o ID de cliente..."
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

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.97 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 mt-2 w-full min-w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 z-50 origin-top custom-scrollbar"
          >
            {/* Loading */}
            {loading && (
              <div className="p-10 flex justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
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

            {/* Resultados */}
            {!loading && !error && searchLen >= 2 && results.length > 0 && (
              <div className="p-1.5 flex flex-col gap-0.5">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-100 mb-1">
                  Resultados desde BD ({results.length})
                </div>
                {results.map((client, index) => {
                  const id = client.idCliente;
                  const nombre = client.nombre || client.name || '';
                  const sucursal = client.sucursal || client.branchName || '';
                  const hasMultiple =
                    results.filter((r) => r.idCliente === id).length > 1;
                  const showSucursal =
                    sucursal &&
                    (sucursal.trim().toLowerCase() !== 'matriz' || hasMultiple);

                  return (
                    <button
                      key={`${client.id ?? id}-${index}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(client);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg flex flex-col justify-center bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-slate-800 truncate">
                        #{id} {toTitleCase(nombre)}
                      </span>
                      {showSucursal && (
                        <span className="text-xs font-semibold text-blue-600 tracking-wide truncate mt-0.5">
                          {toTitleCase(sucursal)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sin resultados */}
            {!loading && !error && searchLen >= 2 && results.length === 0 && (
              <div className="p-8 text-center flex flex-col items-center text-slate-400 gap-3">
                <Search className="w-6 h-6 text-slate-300" />
                <span className="text-sm font-medium text-slate-600">
                  No se encontraron clientes
                </span>
              </div>
            )}

            {/* Prompt inicial */}
            {!loading && !error && searchLen < 2 && (
              <div className="p-8 text-center flex flex-col items-center text-slate-400 gap-3">
                <UserRoundSearch className="w-6 h-6" />
                <span className="text-sm font-medium text-slate-600">
                  Escribe al menos 2 caracteres para buscar
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
