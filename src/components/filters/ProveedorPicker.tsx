import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Truck,
  ChevronDown,
  Check,
  Loader2,
  X,
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProveedores } from '../../hooks/useProveedores';

interface ProveedorPickerProps {
  selectedProveedor: string;
  onSelect: (proveedorId: string) => void;
}

const DROPDOWN_HEIGHT_ESTIMATE = 320;
const SAFETY_MARGIN = 10;

export default function ProveedorPicker({
  selectedProveedor,
  onSelect,
}: ProveedorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { proveedores, loading, error, fetchProveedores } = useProveedores();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
  });
  const [animOrigin, setAnimOrigin] = useState<'top' | 'bottom'>('top');
  const isActive = selectedProveedor !== '';
  const isAll = selectedProveedor === '' || selectedProveedor === 'all';

  const selectedObj = proveedores.find(
    (p) => String(p.id) === String(selectedProveedor)
  );

  const displayText = selectedObj
    ? selectedObj.nombre
    : 'Todos los Proveedores';

  const filteredProveedores = proveedores.filter((prov) =>
    prov.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if (!isOpen) {
      updatePosition();
    }
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
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group w-full">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`w-full px-3 py-2 flex items-center justify-between text-sm transition-all rounded-md border shadow-sm cursor-pointer
          ${isOpen ? 'border-slate-300 ring-1 ring-slate-300' : 'hover:border-slate-300'}
          ${
            isActive
              ? 'bg-white border-slate-300 text-slate-900 font-medium'
              : 'bg-white border-slate-200 text-slate-400'
          }
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <Truck
            className={`w-4 h-4 shrink-0 ${isOpen ? 'text-slate-600' : 'text-slate-400'} ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
          />
          <span className="truncate">{displayText}</span>
        </div>
        <div className="flex items-center shrink-0">
          {isActive ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect('');
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
                setSearchTerm('');
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
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-medium">
                    Sincronizando Proveedores...
                  </span>
                </div>
              ) : error ? (
                <div className="p-6 flex flex-col items-center text-slate-600 text-xs text-center gap-2">
                  <AlertCircle className="w-6 h-6 text-slate-400" />
                  <span className="font-medium text-sm">Error de conexión</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchProveedores();
                    }}
                    className="flex text-xs font-medium items-center gap-1.5 px-3 py-1.5 mt-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reintentar</span>
                  </button>
                </div>
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
                    {searchTerm.trim() === '' && (
                      <>
                        <button
                          onClick={() => {
                            onSelect('');
                            setIsOpen(false);
                            setSearchTerm('');
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors cursor-pointer shrink-0
                          ${
                            isAll
                              ? 'bg-slate-900 text-white font-medium'
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span>Todos los Proveedores</span>
                          {isAll && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="border-t border-slate-100 my-1 shrink-0" />
                      </>
                    )}

                    {filteredProveedores.length > 0 ? (
                      filteredProveedores.map((prov) => {
                        const isSelected =
                          String(selectedProveedor) === String(prov.id);
                        return (
                          <button
                            key={prov.id}
                            onClick={() => {
                              onSelect(String(prov.id));
                              setIsOpen(false);
                              setSearchTerm('');
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors cursor-pointer shrink-0
                            ${
                              isSelected
                                ? 'bg-slate-900 text-white font-medium'
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="truncate pr-2" title={prov.nombre}>
                              {prov.nombre}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
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
