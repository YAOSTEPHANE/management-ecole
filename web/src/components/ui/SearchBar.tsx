import React from 'react';
import { FiSearch } from 'react-icons/fi';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Hauteur et texte réduits (ex. barre outils Élèves) */
  compact?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
  compact = false,
}) => {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute inset-y-0 left-0 flex items-center pointer-events-none ${compact ? 'pl-2' : 'pl-3'}`}
      >
        <FiSearch className={`text-stone-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl transition-all duration-200 border-stone-300/90 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/20 ${
          compact
            ? 'pl-8 pr-3 py-2 text-sm border bg-white/80 text-stone-900'
            : 'pl-10 pr-4 py-3 border-2 bg-white'
        }`}
      />
    </div>
  );
};

export default SearchBar;






