'use client';

import React from 'react';
import { ColorScaleResult } from '@/utils/colorScales';
import { IndicatorMeta } from '@/types';
import { formatIndicatorValue } from '@/utils/formatters';
import { Info } from 'lucide-react';

interface LegendProps {
  colorScale: ColorScaleResult;
  indicator: IndicatorMeta;
  methodLabel: string;
}

export const Legend: React.FC<LegendProps> = ({ colorScale, indicator, methodLabel }) => {
  const { breaks, colors, min, max } = colorScale;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-xl text-xs text-slate-200 max-w-xs w-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-slate-100 leading-tight">{indicator.label}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Unit: <span className="text-slate-300 font-medium">{indicator.unit}</span> • {methodLabel}
          </div>
        </div>
      </div>

      {/* Class breaks color swatches */}
      <div className="space-y-1.5 my-2.5">
        {colors.map((color, idx) => {
          const lower = breaks[idx];
          const upper = breaks[idx + 1] ?? max;
          const lowerFormatted = formatIndicatorValue(lower, indicator.format, '');
          const upperFormatted = formatIndicatorValue(upper, indicator.format, '');

          return (
            <div key={idx} className="flex items-center space-x-2 text-[11px]">
              <div
                className="w-4 h-3.5 rounded-sm shrink-0 border border-black/30 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-300 font-mono">
                {lowerFormatted} – {upperFormatted} {indicator.unit === '%' ? '%' : ''}
              </span>
            </div>
          );
        })}

        {/* Missing / No data representation */}
        <div className="flex items-center space-x-2 text-[11px] pt-1 border-t border-slate-800">
          <div
            className="w-4 h-3.5 rounded-sm shrink-0 border border-slate-600 bg-slate-500/70"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #475569 0, #475569 2px, #64748b 2px, #64748b 4px)'
            }}
          />
          <span className="text-slate-400 italic">No data / Not applicable at this level</span>
        </div>
      </div>

      {/* Footer with source and year */}
      <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-start space-x-1">
        <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <div><strong className="text-slate-300">Source:</strong> {indicator.source}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">{indicator.description}</div>
        </div>
      </div>
    </div>
  );
};

