'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  size?: 'default' | 'sm';
  searchable?: boolean;
}

export function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Selecione...', 
  disabled = false,
  className = '',
  fullWidth = true,
  size = 'default',
  searchable = true
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (!isOpen) setSearchTerm('');
    };
  }, [isOpen]);

  const heightClass = size === 'sm' ? 'py-1.5 px-3 text-xs' : 'py-2.5 px-4 text-sm';

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-950 border border-slate-800 text-slate-300 rounded-lg ${heightClass} focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all hover:border-slate-700 active:scale-[0.99] group ${
          disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
        } ${isOpen ? 'ring-2 ring-blue-500/50 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : ''}`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-500' : 'text-slate-200'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : 'group-hover:text-slate-400'}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[200] top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[12rem]">
          {searchable && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="text"
                  autoFocus
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-1 py-1.5 custom-scrollbar bg-slate-900">
            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all text-left group ${
                  value === opt.value 
                    ? 'bg-blue-600/10 text-blue-400 font-bold border border-blue-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-6 text-center">
                <Search className="w-6 h-6 text-slate-800 mx-auto mb-2 opacity-20" />
                <p className="text-xs text-slate-600 italic">Nenhum resultado encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
