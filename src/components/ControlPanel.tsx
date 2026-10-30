'use client';

import React, { useState } from 'react';
import { AdminLevel, IndicatorMeta, ColorScaleMethod, PaletteName } from '@/types';
import { PALETTES } from '@/utils/colorScales';
import { 
  Layers, 
  Sliders, 
  Palette, 
  Sun, 
  Moon, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Eye, 
  AlertCircle 
} from 'lucide-react';

interface ControlPanelProps {
  currentLevel: AdminLevel;
  onChangeLevel: (level: AdminLevel) => void;
  indicators: IndicatorMeta[];
  selectedIndicator: IndicatorMeta;
  onSelectIndicator: (indicator: IndicatorMeta) => void;
  scaleMethod: ColorScaleMethod;
  onChangeScaleMethod: (method: ColorScaleMethod) => void;
  paletteName: PaletteName;
  onChangePalette: (palette: PaletteName) => void;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  totalFeatures: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentLevel,
  onChangeLevel,
  indicators,
  selectedIndicator,
  onSelectIndicator,
  scaleMethod,
  onChangeScaleMethod,
  paletteName,
  onChangePalette,
  opacity,
  onChangeOpacity,
  isDarkMode,
  onToggleDarkMode,
  totalFeatures
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Group indicators by category
  const categories = Array.from(new Set(indicators.map(i => i.category)));

  const levels: { id: AdminLevel; label: string }[] = [
    { id: 'region', label: 'Region' },
    { id: 'district', label: 'District' },
    { id: 'ward', label: 'Ward' },
    { id: 'village', label: 'Village' }
  ];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-slate-100 max-w-sm w-full overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h1 className="text-sm font-bold tracking-tight">Tanzania Choropleth</h1>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono">
            {totalFeatures} units
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Map' : 'Switch to Dark Map'}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-slate-800/80 text-xs">
          {/* Level Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Administrative Level
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
              {levels.map((lvl) => {
                const isActive = currentLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => onChangeLevel(lvl.id)}
                    className={`py-1.5 px-2 rounded-md font-medium text-center transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
            {currentLevel === 'village' && (
              <p className="text-[10px] text-amber-400/90 flex items-center space-x-1 pt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Village points from OpenStreetMap census-tagged locations.</span>
              </p>
            )}
          </div>

          {/* Indicator Dropdown */}
          <div className="pt-3 space-y-1.5">
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Demographic Indicator
            </label>
            <div className="relative">
              <select
                value={selectedIndicator.id}
                onChange={(e) => {
                  const ind = indicators.find(i => i.id === e.target.value);
                  if (ind) onSelectIndicator(ind);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {categories.map((cat) => (
                  <optgroup key={cat} label={`── ${cat} ──`} className="bg-slate-900 text-slate-300 font-semibold">
                    {indicators
                      .filter(i => i.category === cat)
                      .map((ind) => {
                        const isAvailable = ind.available_levels.includes(currentLevel);
                        return (
                          <option
                            key={ind.id}
                            value={ind.id}
                            disabled={!isAvailable}
                            className={isAvailable ? 'text-slate-100' : 'text-slate-500 italic bg-slate-950'}
                          >
                            {ind.label} {!isAvailable ? '(Not available at this level)' : ''}
                          </option>
                        );
                      })}
                  </optgroup>
                ))}
              </select>
            </div>
            {!selectedIndicator.available_levels.includes(currentLevel) && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-800/50 text-[10px] text-amber-300 flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  <strong>{selectedIndicator.label}</strong> is not published down to the {currentLevel} level. 
                  Showing neutral grey fill. Select <strong>Region</strong> level to view regional survey data.
                </span>
              </div>
            )}
          </div>

          {/* Colour Scale Method & Palette */}
          <div className="pt-3 space-y-3">
            <div>
              <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">
                Classification Method
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => onChangeScaleMethod('natural_breaks')}
                  className={`py-1 rounded font-medium transition ${
                    scaleMethod === 'natural_breaks'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Fisher-Jenks Natural Breaks algorithm"
                >
                  Natural Breaks
                </button>
                <button
                  onClick={() => onChangeScaleMethod('quantile')}
                  className={`py-1 rounded font-medium transition ${
                    scaleMethod === 'quantile'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Equal frequency quantiles"
                >
                  Quantiles
                </button>
                <button
                  onClick={() => onChangeScaleMethod('equal_interval')}
                  className={`py-1 rounded font-medium transition ${
                    scaleMethod === 'equal_interval'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Equal ranges between min and max"
                >
                  Equal Step
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">
                Color Palette
              </label>
              <select
                value={paletteName}
                onChange={(e) => onChangePalette(e.target.value as PaletteName)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(PALETTES).map(([key, info]) => (
                  <option key={key} value={key} className="bg-slate-900">
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="pt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              <span>Fill Opacity</span>
              <span className="font-mono text-emerald-400">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

