import React, { useState } from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  /** Valeur sélectionnée (nom explicite) */
  selected?: string;
  /** Alias de `selected` (compatibilité avec les anciens appels) */
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  /** Bouton déclencheur plus bas (ex. barre outils Élèves) */
  compact?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  selected,
  value,
  onChange,
  label = 'Filtrer',
  className = '',
  compact = false,
}) => {
  const current = selected ?? value ?? '';
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === current);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center rounded-xl transition-all shadow-sm ${
          compact
            ? 'space-x-1.5 px-2.5 py-2 border text-left'
            : 'space-x-2 px-4 py-3 border-2'
        } ${
          isOpen
            ? 'border-indigo-300/90 bg-gradient-to-r from-indigo-50/95 via-violet-50/90 to-indigo-50/95 ring-2 ring-violet-300/40'
            : 'border-stone-300/90 bg-white/90 hover:border-indigo-300/60 hover:bg-indigo-50/30'
        }`}
      >
        <FiFilter
          className={`shrink-0 ${compact ? 'h-4 w-4' : 'h-5 w-5'} ${
            isOpen ? 'text-indigo-500' : 'text-indigo-400/80'
          }`}
        />
        <span
          className={`font-medium shrink-0 ${compact ? 'text-xs' : 'text-sm'} ${
            isOpen ? 'text-indigo-900' : 'text-stone-800'
          }`}
        >
          {label}
        </span>
        <span
          className={`truncate min-w-0 ${compact ? 'text-xs' : 'text-sm'} ${
            isOpen ? 'text-violet-800' : 'text-stone-600'
          }`}
        >
          {selectedOption?.label || 'Tous'}
        </span>
        <FiChevronDown
          className={`transition-transform shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${
            isOpen ? 'rotate-180 text-indigo-600' : 'text-indigo-400/70'
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[45]"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div
            className={`absolute z-50 mt-2 min-w-[12rem] max-w-[min(100vw-2rem,20rem)] max-h-[min(70vh,20rem)] overflow-y-auto rounded-xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/98 via-violet-50/95 to-white py-1 shadow-lg shadow-indigo-200/30 ring-2 ring-violet-300/25 backdrop-blur-xl ${
              compact ? 'w-44' : 'w-52'
            }`}
          >
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left transition-colors ${
                  compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
                } ${
                  current === option.value
                    ? 'bg-gradient-to-r from-violet-200/95 to-indigo-200/90 text-indigo-950 font-semibold'
                    : 'text-indigo-950/85 hover:bg-indigo-100/80 hover:text-indigo-950'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FilterDropdown;






