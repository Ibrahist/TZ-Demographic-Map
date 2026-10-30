'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { exportToCSV, exportMapToPNG } from '@/utils/exportUtils';

interface ExportButtonsProps {
  currentData: any[];
  mapElementId: string;
  currentLevel: string;
  indicatorId: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  currentData,
  mapElementId,
  currentLevel,
  indicatorId
}) => {
  const [isExportingPng, setIsExportingPng] = useState(false);

  const handleExportCSV = () => {
    const filename = `tanzania_${currentLevel}_${indicatorId}_${new Date().toISOString().slice(0, 10)}`;
    exportToCSV(currentData, filename);
  };

  const handleExportPNG = async () => {
    setIsExportingPng(true);
    const filename = `tanzania_${currentLevel}_map_${new Date().toISOString().slice(0, 10)}`;
    try {
      await exportMapToPNG(mapElementId, filename);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleExportCSV}
        title="Download current view data as CSV"
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 border border-slate-600 hover:border-slate-500 text-xs font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Export CSV</span>
      </button>

      <button
        onClick={handleExportPNG}
        disabled={isExportingPng}
        title="Download map image as PNG"
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-medium shadow-md transition disabled:opacity-50"
      >
        <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">
          {isExportingPng ? 'Rendering...' : 'Export PNG'}
        </span>
      </button>
    </div>
  );
};

