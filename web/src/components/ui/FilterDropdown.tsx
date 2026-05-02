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
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  selected,
  value,
  onChange,
  label = 'Filtrer',
  className = '',
}) => {
  const current = selected ?? value ?? '';
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === current);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
      >
        <FiFilter className="h-5 w-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{selectedOption?.label || 'Tous'}</span>
        <FiChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute z-20 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  current === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
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






