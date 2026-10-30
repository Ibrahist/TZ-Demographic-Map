'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { AdminLevel } from '@/types';

export interface SearchResultItem {
  name: string;
  pcode: string;
  level: AdminLevel;
  parentRegionName?: string;
  parentDistrictName?: string;
  parentDistrictPcode?: string;
  parentRegionPcode?: string;
}

interface SearchBarProps {
  onSelectUnit: (item: SearchResultItem) => void;
  units: SearchResultItem[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectUnit, units }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length >= 2
    ? units.filter(u => u.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    onSelectUnit(item);
    setQuery(item.name);
    setIsOpen(false);
  };

  const levelBadge = (level: AdminLevel) => {
    switch (level) {
      case 'region':
        return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
      case 'district':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
      case 'ward':
        return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search region, district, ward..."
          className="w-full pl-9 pr-8 py-2 bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 shadow-inner transition"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition backdrop-blur-sm"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl max-h-64 overflow-y-auto divide-y divide-white/5 text-xs">
          {filtered.map((item, idx) => (
            <button
              key={`${item.level}-${item.pcode}-${idx}`}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800 text-left transition"
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">{item.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {item.parentDistrictName ? `${item.parentDistrictName}, ` : ''}
                    {item.parentRegionName ? item.parentRegionName : ''}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${levelBadge(item.level)}`}>
                {item.level}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

