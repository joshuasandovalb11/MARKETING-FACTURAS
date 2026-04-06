// src/components/filters/StatusPicker.tsx
import { Check } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los Clientes' },
  { value: 'active', label: 'Con Facturas' },
  { value: 'inactive', label: 'Sin Facturas' },
];

interface StatusPickerProps {
  selectedStatus: string;
  onSelect: (status: string) => void;
}

export default function StatusPicker({
  selectedStatus,
  onSelect,
}: StatusPickerProps) {
  const effectiveValue = selectedStatus === '' ? 'all' : selectedStatus;

  return (
    <div className="flex flex-col gap-0.5">
      {STATUS_OPTIONS.map((option) => {
        const isSelected = effectiveValue === option.value;
        const isExplicitlySet =
          selectedStatus !== '' && selectedStatus === option.value;

        return (
          <button
            key={option.value}
            onClick={() => {
              if (option.value === 'all' && selectedStatus === 'all') {
                onSelect('');
              } else if (option.value === 'all' && selectedStatus === '') {
                onSelect('all');
              } else {
                onSelect(option.value);
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer
              ${
                isSelected
                  ? isExplicitlySet ||
                    (option.value === 'all' && selectedStatus === 'all')
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-50 text-slate-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors
                ${
                  isSelected
                    ? isExplicitlySet ||
                      (option.value === 'all' && selectedStatus === 'all')
                      ? 'bg-white border-white'
                      : 'bg-slate-300 border-slate-300'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && (
                  <Check
                    className={`w-2.5 h-2.5 ${
                      isExplicitlySet ||
                      (option.value === 'all' && selectedStatus === 'all')
                        ? 'text-slate-900'
                        : 'text-white'
                    }`}
                  />
                )}
              </div>
              <span>{option.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
