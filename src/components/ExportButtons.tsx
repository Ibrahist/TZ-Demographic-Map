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



    </div>
  );
};

