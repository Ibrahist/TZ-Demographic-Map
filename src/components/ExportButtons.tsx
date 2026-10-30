'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface ExportButtonsProps {
  onOpenAreaExport: () => void;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ onOpenAreaExport }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onOpenAreaExport}
        title="Export individual area data as CSV, PDF, or GeoJSON"
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <Download className="w-3.5 h-3.5 text-white" />
        <span className="hidden sm:inline">Export Area Data</span>
      </button>
    </div>
  );
};
