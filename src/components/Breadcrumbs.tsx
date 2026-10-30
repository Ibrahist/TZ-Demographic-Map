'use client';

import React from 'react';
import { ChevronRight, Home, MapPin } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

interface BreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (index: number) => void;
  onExportArea?: (item: BreadcrumbItem) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs, onNavigate, onExportArea }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-700 shadow-md">
      {breadcrumbs.map((item, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        const isHome = idx === 0;

        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <button
              onClick={() => onNavigate(idx)}
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition ${
                isLast
                  ? 'font-semibold text-emerald-300 bg-emerald-950 border border-emerald-600 shadow-sm'
                  : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isHome ? (
                <Home className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
              ) : (
                <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
              )}
              <span>{item.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

