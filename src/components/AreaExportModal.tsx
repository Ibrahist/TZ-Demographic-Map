'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  MapPin, 
  Download, 
  Check, 
  Search, 
  Building2, 
  Users, 
  Maximize2, 
  TrendingUp, 
  Activity, 
  GraduationCap 
} from 'lucide-react';
import { AdminLevel, FeatureProperties } from '@/types';
import { 
  exportAreaToCSV, 
  exportAreaToGeoJSON, 
  exportAreaToPDF, 
  sanitizeFilename 
} from '@/utils/exportUtils';

interface AreaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArea: FeatureProperties | null;
  currentLevel: AdminLevel;
  regionsData: any;
  districtsData: any;
  currentGeoJson: any;
  villagePoints: any;
}

export const AreaExportModal: React.FC<AreaExportModalProps> = ({
  isOpen,
  onClose,
  initialArea,
  currentLevel,
  regionsData,
  districtsData,
  currentGeoJson,
  villagePoints
}) => {
  const [selectedLevel, setSelectedLevel] = useState<AdminLevel>(
    initialArea?.level || currentLevel || 'region'
  );
  const [selectedPcode, setSelectedPcode] = useState<string>(
    initialArea?.pcode || initialArea?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState<'csv' | 'geojson' | 'pdf' | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Synchronize when initialArea changes
  useEffect(() => {
    if (initialArea) {
      setSelectedLevel(initialArea.level || currentLevel || 'region');
      setSelectedPcode(initialArea.pcode || initialArea.id || '');
    }
  }, [initialArea, currentLevel]);

  // Aggregate list of available areas for the selected level
  const availableFeatures = useMemo(() => {
    let sourceGeoJson: any = null;
    if (selectedLevel === 'region') sourceGeoJson = regionsData;
    else if (selectedLevel === 'district') sourceGeoJson = districtsData;
    else if (selectedLevel === 'ward') sourceGeoJson = currentGeoJson;
    else if (selectedLevel === 'village') sourceGeoJson = villagePoints || currentGeoJson;

    if (!sourceGeoJson || !sourceGeoJson.features) return [];

    return sourceGeoJson.features.map((f: any) => ({
      properties: {
        ...f.properties,
        level: f.properties.level || selectedLevel
      },
      geometry: f.geometry
    }));
  }, [selectedLevel, regionsData, districtsData, currentGeoJson, villagePoints]);

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return availableFeatures;
    const q = searchQuery.toLowerCase();
    return availableFeatures.filter((item: any) => {
      const name = (item.properties.name || '').toLowerCase();
      const pcode = (item.properties.pcode || item.properties.id || '').toLowerCase();
      const parentName = (item.properties.parent_district_name || item.properties.parent_region_name || item.properties.adm2_name || '').toLowerCase();
      return name.includes(q) || pcode.includes(q) || parentName.includes(q);
    });
  }, [availableFeatures, searchQuery]);

  // Determine the currently active feature object
  const activeFeature = useMemo(() => {
    if (selectedPcode) {
      const found = availableFeatures.find(
        (f: any) => f.properties.pcode === selectedPcode || f.properties.id === selectedPcode
      );
      if (found) return found;
    }
    // Fallback to initialArea if level matches
    if (initialArea && (initialArea.level === selectedLevel || !initialArea.level)) {
      return {
        properties: initialArea,
        geometry: (initialArea as any).geometry || null
      };
    }
    // Default to first feature in list
    return availableFeatures.length > 0 ? availableFeatures[0] : null;
  }, [availableFeatures, selectedPcode, initialArea, selectedLevel]);

  if (!isOpen) return null;

  const currentProps = activeFeature?.properties || {};
  const currentGeometry = activeFeature?.geometry || null;
  const areaName = currentProps.name || 'Tanzania Area';
  const areaLevel = currentProps.level || selectedLevel;
  const baseFilename = `${sanitizeFilename(areaName)}_${areaLevel}_${new Date().toISOString().slice(0, 10)}`;

  const handleExport = async (format: 'csv' | 'geojson' | 'pdf') => {
    if (!activeFeature) return;
    try {
      setIsExporting(format);
      if (format === 'csv') {
        exportAreaToCSV(currentProps, baseFilename);
        setExportSuccess(`Exported ${areaName} as CSV`);
      } else if (format === 'geojson') {
        exportAreaToGeoJSON(currentProps, currentGeometry, baseFilename);
        setExportSuccess(`Exported ${areaName} as GeoJSON`);
      } else if (format === 'pdf') {
        await exportAreaToPDF(currentProps, baseFilename);
        setExportSuccess(`Exported ${areaName} as PDF`);
      }
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err) {
      console.error(`Error exporting ${format}:`, err);
    } finally {
      setIsExporting(null);
    }
  };

  const levelBadge = (lvl: string) => {
    switch (lvl) {
      case 'region':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'district':
        return 'bg-sky-950 text-sky-300 border-sky-700';
      case 'ward':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'village':
        return 'bg-purple-950 text-purple-300 border-purple-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Export Individual Area Data</h2>
              <p className="text-xs text-slate-400">
                Download comprehensive census & survey metrics as CSV, PDF, or GeoJSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Level Switcher */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              1. Choose Administrative Level
            </label>
            <div className="grid grid-cols-4 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
              {(['region', 'district', 'ward', 'village'] as AdminLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    setSelectedPcode('');
                    setSearchQuery('');
                  }}
                  className={`py-1.5 px-2 rounded-md capitalize transition ${
                    selectedLevel === lvl
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Area Selector / Search */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              2. Select {selectedLevel.toUpperCase()}
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder={`Search among ${availableFeatures.length} ${selectedLevel}s...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              {filteredFeatures.slice(0, 48).map((item: any) => {
                const pcode = item.properties.pcode || item.properties.id || '';
                const name = item.properties.name || 'Unnamed';
                const isSelected = activeFeature?.properties?.pcode === pcode || activeFeature?.properties?.id === pcode;
                return (
                  <button
                    key={pcode}
                    onClick={() => setSelectedPcode(pcode)}
                    className={`px-2 py-1.5 rounded text-left truncate transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950 border border-emerald-600 text-emerald-300 font-semibold shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    title={name}
                  >
                    <span className="truncate">{name}</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
              {filteredFeatures.length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-slate-500">
                  No matching {selectedLevel}s found.
                </div>
              )}
            </div>
          </div>

          {/* Active Area Summary Card */}
          {activeFeature && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${levelBadge(areaLevel)}`}>
                      {areaLevel}
                    </span>
                    {currentProps.pcode && (
                      <span className="text-xs font-mono text-slate-400">
                        {currentProps.pcode}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1 flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{areaName}</span>
                  </h3>
                  {(currentProps.parent_region_name || currentProps.parent_district_name || currentProps.adm1_name) && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Hierarchy:{' '}
                      {[
                        currentProps.adm3_name,
                        currentProps.parent_district_name || currentProps.adm2_name,
                        currentProps.parent_region_name || currentProps.adm1_name
                      ]
                        .filter(Boolean)
                        .join(' → ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Indicator Preview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                {currentProps.total_population !== undefined && (
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <Users className="w-3 h-3 text-sky-400" />
                      <span>Population</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                      {Number(currentProps.total_population).toLocaleString()}
                    </div>
                  </div>
                )}
                {currentProps.area_km2 !== undefined && (
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <Maximize2 className="w-3 h-3 text-amber-400" />
                      <span>Land Area</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                      {Number(currentProps.area_km2).toFixed(1)} km²
                    </div>
                  </div>
                )}
                {currentProps.population_density !== undefined && (
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span>Density</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                      {Number(currentProps.population_density).toFixed(1)} / km²
                    </div>
                  </div>
                )}
                {(currentProps.health_facilities_count !== undefined || currentProps.schools_count !== undefined) && (
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <Activity className="w-3 h-3 text-purple-400" />
                      <span>Facilities</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                      {currentProps.health_facilities_count || 0} H / {currentProps.schools_count || 0} S
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Notification */}
          {exportSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* 3 Dedicated Export Buttons */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              3. Download Formats
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CSV Export */}
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting !== null}
                className="flex flex-col items-start p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-600 hover:border-emerald-500 transition-all text-left group shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                    .CSV
                  </span>
                </div>
                <div className="font-bold text-xs text-white">Export as CSV</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Tabular data with all demographic indicators & metrics
                </div>
                <div className="mt-3 text-[11px] font-semibold text-emerald-400 flex items-center space-x-1">
                  <span>{isExporting === 'csv' ? 'Generating...' : 'Download CSV'}</span>
                  <Download className="w-3 h-3 ml-0.5" />
                </div>
              </button>

              {/* GeoJSON Export */}
              <button
                onClick={() => handleExport('geojson')}
                disabled={isExporting !== null}
                className="flex flex-col items-start p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-600 hover:border-sky-500 transition-all text-left group shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="p-2 rounded-lg bg-sky-950 border border-sky-700 text-sky-400 group-hover:scale-105 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800">
                    .GEOJSON
                  </span>
                </div>
                <div className="font-bold text-xs text-white">Export as GeoJSON</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Boundary polygon/coordinates & full properties for GIS tools
                </div>
                <div className="mt-3 text-[11px] font-semibold text-sky-400 flex items-center space-x-1">
                  <span>{isExporting === 'geojson' ? 'Generating...' : 'Download GeoJSON'}</span>
                  <Download className="w-3 h-3 ml-0.5" />
                </div>
              </button>

              {/* PDF Export */}
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting !== null}
                className="flex flex-col items-start p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-600 hover:border-rose-500 transition-all text-left group shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="p-2 rounded-lg bg-rose-950 border border-rose-700 text-rose-400 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                    .PDF
                  </span>
                </div>
                <div className="font-bold text-xs text-white">Export as PDF</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Print-ready demographic summary profile & health report
                </div>
                <div className="mt-3 text-[11px] font-semibold text-rose-400 flex items-center space-x-1">
                  <span>{isExporting === 'pdf' ? 'Generating...' : 'Download PDF'}</span>
                  <Download className="w-3 h-3 ml-0.5" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-600 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

