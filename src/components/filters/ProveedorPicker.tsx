import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Truck, ChevronDown, Check, X, Search, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProveedores } from '../../hooks/useProveedores';
import { useProveedorFavorites } from '../../hooks/useProveedorFavorites';
import AsyncFeedbackBlock from '../ui/feedback/AsyncFeedbackBlock';
import { useNotificationToast } from '../../hooks/useNotificationToast';
import { resolveErrorMessageNotification } from '../../utils/notificationPolicy';

interface ProveedorPickerProps {
  selectedProveedores: string[];
  onChange: (proveedorIds: string[]) => void;
}

const DROPDOWN_HEIGHT_ESTIMATE = 320;
const SAFETY_MARGIN = 10;

export default function ProveedorPicker({
  selectedProveedores,
  onChange,
}: ProveedorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { favorites, toggleFavorite } = useProveedorFavorites();
  const { proveedores, loading, error, errorMessage, fetchProveedores } =
    useProveedores();
  const { notify } = useNotificationToast();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
  });
  const [animOrigin, setAnimOrigin] = useState<'top' | 'bottom'>('top');

  const selectedIds = Array.from(
    new Set(selectedProveedores.map((id) => String(id)))
  );
  const selectedIdsSet = new Set(selectedIds);
  const isActive = selectedIds.length > 0;
  const isAll = selectedIds.length === 0;
  const selectedNames = proveedores
    .filter((p) => selectedIdsSet.has(String(p.id)))
    .map((p) => p.nombre);
  const displayText =
    selectedIds.length === 0
      ? 'Todos los Proveedores'
      : selectedIds.length === 1
        ? selectedNames[0] || '1 proveedor seleccionado'
        : `${selectedIds.length} proveedores seleccionados`;

  const handleToggleFavorite = (e: React.MouseEvent, provId: string) => {
    e.stopPropagation();
    toggleFavorite(provId);
  };

  const toggleProveedor = (provId: string) => {
    if (selectedIdsSet.has(provId)) {
      onChange(selectedIds.filter((id) => id !== provId));
      return;
    }

    onChange([...selectedIds, provId]);
  };

  const { favList, restList } = (() => {
    const filtered = proveedores.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const favs = filtered
      .filter((p) => favorites.has(String(p.id)))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    const rest = filtered
      .filter((p) => !favorites.has(String(p.id)))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    return { favList: favs, restList: rest };
  })();

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownWidth = Math.max(rect.width, 320);

    const spaceBelow = viewportHeight - rect.bottom - SAFETY_MARGIN - 30;
    const spaceAbove = rect.top - SAFETY_MARGIN - 30;
    const MIN_LIST_HEIGHT = 100;

    let style: React.CSSProperties;

    if (spaceBelow < DROPDOWN_HEIGHT_ESTIMATE && spaceAbove > spaceBelow) {
      style = {
        position: 'fixed',
        bottom: viewportHeight - rect.top + 8,
        left: rect.left,
        width: dropdownWidth,
        maxHeight: Math.max(spaceAbove, MIN_LIST_HEIGHT),
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
      };
      setAnimOrigin('bottom');
    } else {
      style = {
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: dropdownWidth,
        maxHeight: Math.max(spaceBelow, MIN_LIST_HEIGHT),
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
      };
      setAnimOrigin('top');
    }
    setDropdownStyle(style);
  };

  const handleToggle = () => {
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, { capture: true });
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, { capture: true });
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!error || !errorMessage) return;

    notify(
      resolveErrorMessageNotification({
        scope: 'proveedores-picker',
        message: errorMessage,
        fallback: 'No se pudieron cargar los proveedores.',
      })
    );
  }, [error, errorMessage, notify]);

  const ProveedorRow = ({ prov }: { prov: { id: string; nombre: string } }) => {
    const providerId = String(prov.id);
    const isSelected = selectedIdsSet.has(providerId);
    const isFav = favorites.has(String(prov.id));

    return (
      <button
        key={prov.id}
        onClick={() => {
          toggleProveedor(providerId);
        }}
        className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between gap-2 transition-colors cursor-pointer shrink-0 group/row
          ${isSelected ? 'bg-slate-900/5 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0
              ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white text-transparent'}`}
          >
            <Check className="w-3 h-3" />
          </span>

          <span className="truncate flex-1" title={prov.nombre}>
            {prov.nombre}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Estrella de favorito */}
          <span
            onClick={(e) => handleToggleFavorite(e, String(prov.id))}
            className={`rounded transition-colors cursor-pointer
              ${
                isFav
                  ? 'text-amber-400 hover:text-amber-500'
                  : isSelected
                    ? 'text-slate-500 hover:text-amber-300'
                    : 'text-transparent group-hover/row:text-slate-500 hover:text-amber-400!'
              }`}
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="relative group w-full">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`w-full px-3 py-2 flex items-center justify-between text-sm transition-all rounded-md border shadow-sm cursor-pointer
          ${isOpen ? 'border-slate-300 ring-1 ring-slate-300' : 'hover:border-slate-300'}
          ${isActive ? 'bg-white border-slate-300 text-slate-900 font-medium' : 'bg-white border-slate-200 text-slate-400'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <Truck
            className={`w-4 h-4 shrink-0 ${isOpen || isActive ? 'text-slate-900' : 'text-slate-400'}`}
          />
          <span className="truncate">{displayText}</span>
        </div>
        <div className="flex items-center shrink-0">
          {isActive ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
                setSearchTerm('');
              }}
              className="ml-2 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </div>
          ) : (
            <ChevronDown
              className={`ml-2 w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 text-slate-600' : 'text-slate-400'}`}
            />
          )}
        </div>
      </button>

      {isOpen &&
        createPortal(
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px]"
              style={{ zIndex: 99998 }}
              onClick={() => {
                setIsOpen(false);
              }}
            />

            <motion.div
              ref={dropdownRef}
              initial={{
                opacity: 0,
                scale: 0.97,
                transformOrigin:
                  animOrigin === 'top' ? 'top left' : 'bottom left',
              }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              style={dropdownStyle}
              className="fixed bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden"
            >
              {loading ? (
                <AsyncFeedbackBlock
                  isLoading={true}
                  isError={false}
                  loadingMessage="Sincronizando proveedores..."
                  errorMessage=""
                />
              ) : error ? (
                <AsyncFeedbackBlock
                  isLoading={false}
                  isError={true}
                  loadingMessage=""
                  errorMessage={
                    errorMessage || 'No se pudieron cargar los proveedores.'
                  }
                  onRetry={() => {
                    void fetchProveedores();
                  }}
                />
              ) : (
                <>
                  <div className="p-2 border-b border-slate-100 bg-white shrink-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5 custom-scrollbar min-h-0">
                    {/* OPCIÓN: Todos */}
                    {searchTerm.trim() === '' && (
                      <>
                        <button
                          onClick={() => {
                            onChange([]);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors cursor-pointer shrink-0
                          ${isAll ? 'bg-slate-900 text-white font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span>Todos los Proveedores</span>
                          {isAll && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="border-t border-slate-200 my-1 shrink-0" />
                      </>
                    )}

                    {/* FAVORITOS */}
                    {favList.length > 0 && (
                      <>
                        <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Favoritos
                        </p>
                        {favList.map((prov) => (
                          <ProveedorRow key={prov.id} prov={prov} />
                        ))}
                        <div className="border-t border-slate-200 my-1 shrink-0" />
                      </>
                    )}

                    {/* RESTO */}
                    {restList.length > 0
                      ? restList.map((prov) => (
                          <ProveedorRow key={prov.id} prov={prov} />
                        ))
                      : favList.length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No se encontraron resultados
                          </div>
                        )}
                  </div>
                </>
              )}
            </motion.div>
          </>,
          document.body
        )}
    </div>
  );
}
