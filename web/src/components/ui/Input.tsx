import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-stone-800 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-3 border-2 rounded-xl bg-white/95 shadow-sm text-stone-900 placeholder:text-stone-400 transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-amber-500/45 focus:ring-offset-2 focus:ring-offset-white focus:border-amber-500/45 hover:border-stone-400/80 ${
            error ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : 'border-stone-200/90'
          } ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-700 font-medium">{error}</p>}
    </div>
  );
};

export default Input;






