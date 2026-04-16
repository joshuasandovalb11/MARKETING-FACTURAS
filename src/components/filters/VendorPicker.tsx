import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  ChevronDown,
  Check,
  Loader2,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useVendors } from '../../hooks/useVendors';

interface VendorPickerProps {
  selectedVendor: string;
  onSelect: (vendorId: string) => void;
}

const DROPDOWN_HEIGHT_ESTIMATE = 280;
const SAFETY_MARGIN = 10;

export default function VendorPicker({
  selectedVendor,
  onSelect,
}: VendorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { vendors, loading, error, fetchVendors } = useVendors();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
  });
  const [animOrigin, setAnimOrigin] = useState<'top' | 'bottom'>('top');
  const isActive = selectedVendor !== '';
  const isAll = selectedVendor === '' || selectedVendor === 'all';

  const selectedObj = vendors.find(
    (v) => String(v.id) === String(selectedVendor)
  );

  const displayText = selectedObj ? selectedObj.nombre : 'Todos los Vendedores';

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownWidth = Math.max(rect.width, 300);

    const spaceBelow = viewportHeight - rect.bottom - SAFETY_MARGIN;
    const spaceAbove = rect.top - SAFETY_MARGIN;

    let style: React.CSSProperties;

    if (spaceBelow < DROPDOWN_HEIGHT_ESTIMATE && spaceAbove > spaceBelow) {
      style = {
        position: 'fixed',
        bottom: viewportHeight - rect.top + 8,
        left: rect.left,
        width: dropdownWidth,
        maxHeight: spaceAbove,
        overflowY: 'auto',
        zIndex: 99999,
      };
      setAnimOrigin('bottom');
    } else {
      style = {
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: dropdownWidth,
        maxHeight: spaceBelow,
        overflowY: 'auto',
        zIndex: 99999,
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
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group min-w-48" ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`w-full px-3 py-2 flex items-center justify-between text-sm transition-all cursor-pointer rounded-md border shadow-sm
          ${isOpen ? 'border-slate-300 ring-1 ring-slate-300' : 'hover:border-slate-300'}
          ${
            isActive
              ? 'bg-white border-slate-300 text-slate-900 font-medium'
              : 'bg-white border-slate-200 text-slate-400'
          }
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <Users
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
              }}
              className="ml-2 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
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
              onClick={() => setIsOpen(false)}
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
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-medium">
                    Sincronizando Vendedores...
                  </span>
                </div>
              ) : error ? (
                <div className="p-6 flex flex-col items-center text-slate-600 text-xs text-center gap-2">
                  <AlertCircle className="w-6 h-6 text-slate-400" />
                  <span className="font-medium text-sm">Error de conexión</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchVendors();
                    }}
                    className="flex text-xs font-medium items-center gap-1.5 px-3 py-1.5 mt-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reintentar</span>
                  </button>
                </div>
              ) : (
                <div className="p-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      onSelect('');
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors cursor-pointer
                    ${
                      isAll
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>Todos los Vendedores</span>
                    {isAll && <Check className="w-4 h-4" />}
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  {vendors.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1.5 px-1">
                      {vendors.map((vend) => {
                        const isSelected =
                          String(selectedVendor) === String(vend.id);
                        return (
                          <button
                            key={vend.id}
                            onClick={() => {
                              onSelect(String(vend.id));
                              setIsOpen(false);
                            }}
                            title={vend.nombre}
                            className={`flex items-center justify-center px-1 py-2 text-xs rounded-md transition-colors cursor-pointer border
                            ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-white font-bold'
                                : 'bg-white border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                            }`}
                          >
                            <span className="truncate max-w-full">
                              {vend.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No hay vendedores.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>,
          document.body
        )}
    </div>
  );
}
