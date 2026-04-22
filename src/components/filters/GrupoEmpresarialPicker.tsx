import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ChevronDown, Check, X, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGruposEmpresariales } from '../../hooks/useGruposEmpresariales';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import AsyncFeedbackBlock from '../ui/feedback/AsyncFeedbackBlock';
import { useNotificationToast } from '../../hooks/useNotificationToast';
import { resolveErrorMessageNotification } from '../../utils/notificationPolicy';

interface GrupoEmpresarialPickerProps {
  selectedGrupoEmpresarialIds: string[];
  onChange: (grupoIds: string[]) => void;
}

const DROPDOWN_HEIGHT_ESTIMATE = 320;
const SAFETY_MARGIN = 10;

interface GroupRowItem {
  id: string;
  nombre: string;
}

interface GrupoRowProps {
  group: GroupRowItem;
  isSelected: boolean;
  onToggleGrupo: (groupId: string) => void;
}

const GrupoRow = memo(function GrupoRow({
  group,
  isSelected,
  onToggleGrupo,
}: GrupoRowProps) {
  const groupId = String(group.id);

  return (
    <button
      onClick={() => {
        onToggleGrupo(groupId);
      }}
      className={`w-full cursor-pointer shrink-0 rounded-md px-3 py-2 text-left text-xs transition-colors ${
        isSelected
          ? 'bg-slate-900/5 font-medium text-slate-900'
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
            isSelected
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 bg-white text-transparent'
          }`}
        >
          <Check className="h-3 w-3" />
        </span>

        <span className="truncate" title={group.nombre}>
          {group.nombre}
        </span>
      </div>
    </button>
  );
});

export default function GrupoEmpresarialPicker({
  selectedGrupoEmpresarialIds,
  onChange,
}: GrupoEmpresarialPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 180);
  const {
    gruposEmpresariales,
    loading,
    error,
    errorMessage,
    fetchGruposEmpresariales,
  } = useGruposEmpresariales();
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
    new Set(selectedGrupoEmpresarialIds.map((id) => String(id)))
  );
  const selectedId = selectedIds[0] || '';
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const isActive = selectedIds.length > 0;
  const isAll = selectedIds.length === 0;

  const selectedNames = gruposEmpresariales
    .filter((group) => selectedIdsSet.has(String(group.id)))
    .map((group) => group.nombre);

  const displayText =
    selectedIds.length === 0
      ? 'Todos los Grupos Empresariales'
      : selectedIds.length === 1
        ? selectedNames[0] || '1 grupo seleccionado'
        : `${selectedIds.length} grupos seleccionados`;

  const groupsPrepared = useMemo(() => {
    return [...gruposEmpresariales]
      .map((group) => ({
        id: String(group.id),
        nombre: group.nombre,
        nombreLower: group.nombre.toLowerCase(),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [gruposEmpresariales]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
    const filtered = normalizedSearch
      ? groupsPrepared.filter((group) =>
          group.nombreLower.includes(normalizedSearch)
        )
      : groupsPrepared;

    return filtered.map((group) => ({ id: group.id, nombre: group.nombre }));
  }, [debouncedSearchTerm, groupsPrepared]);

  const toggleGrupo = useCallback(
    (groupId: string) => {
      if (selectedId === groupId) {
        onChange([]);
        return;
      }

      onChange([groupId]);
      setIsOpen(false);
    },
    [onChange, selectedId]
  );

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownWidth = Math.max(rect.width, 320);

    const spaceBelow = viewportHeight - rect.bottom - SAFETY_MARGIN - 30;
    const spaceAbove = rect.top - SAFETY_MARGIN - 30;
    const minListHeight = 100;

    let style: React.CSSProperties;

    if (spaceBelow < DROPDOWN_HEIGHT_ESTIMATE && spaceAbove > spaceBelow) {
      style = {
        position: 'fixed',
        bottom: viewportHeight - rect.top + 8,
        left: rect.left,
        width: dropdownWidth,
        maxHeight: Math.max(spaceAbove, minListHeight),
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
        maxHeight: Math.max(spaceBelow, minListHeight),
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
    if (!isOpen) return;

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { capture: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, { capture: true });
    };
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
        scope: 'grupos-empresariales-picker',
        message: errorMessage,
        fallback: 'No se pudieron cargar los grupos empresariales.',
      })
    );
  }, [error, errorMessage, notify]);

  return (
    <div className="group relative w-full">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`w-full px-3 py-2 flex items-center justify-between text-sm transition-all rounded-md border shadow-sm cursor-pointer
          ${isOpen ? 'border-slate-300 ring-1 ring-slate-300' : 'hover:border-slate-300'}
          ${isActive ? 'bg-white border-slate-300 text-slate-900 font-medium' : 'bg-white border-slate-200 text-slate-400'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <Building2
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
                  loadingMessage="Sincronizando grupos empresariales..."
                  errorMessage=""
                />
              ) : error ? (
                <AsyncFeedbackBlock
                  isLoading={false}
                  isError={true}
                  loadingMessage=""
                  errorMessage={
                    errorMessage ||
                    'No se pudieron cargar los grupos empresariales.'
                  }
                  onRetry={() => {
                    void fetchGruposEmpresariales();
                  }}
                />
              ) : (
                <>
                  <div className="p-2 border-b border-slate-100 bg-white shrink-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar grupo empresarial..."
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
                            onChange([]);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors cursor-pointer shrink-0
                          ${isAll ? 'bg-slate-900 text-white font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span>Todos los Grupos Empresariales</span>
                          {isAll && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="border-t border-slate-200 my-1 shrink-0" />
                      </>
                    )}

                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((group) => (
                        <GrupoRow
                          key={group.id}
                          group={group}
                          isSelected={selectedIdsSet.has(String(group.id))}
                          onToggleGrupo={toggleGrupo}
                        />
                      ))
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
