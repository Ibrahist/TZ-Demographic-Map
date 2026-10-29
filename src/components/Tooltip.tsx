'use client';
import React, { useLayoutEffect, useState, useRef } from 'react';
import { HoverTooltipData } from '@/types';
import { MapPin } from 'lucide-react';

export const Tooltip: React.FC<{ data: HoverTooltipData | null }> = ({ data }) => {
  if (!data) return null;
  return (
    <div className="fixed z-50 pointer-events-none p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-xs shadow-xl"
         style={{ left: `${data.x + 15}px`, top: `${data.y + 15}px` }}>
      <div className="flex items-center space-x-1 font-bold text-sm">
        <MapPin className="w-4 h-4 text-emerald-400" />
        <span>{data.name}</span>
      </div>
      <div className="text-[10px] uppercase text-emerald-400 font-semibold">{data.level} ({data.pcode})</div>
      <div className="mt-2 bg-emerald-950/60 border border-emerald-500/30 rounded-lg p-2">
        <div className="text-[10px] text-emerald-300 font-semibold">{data.indicatorLabel}</div>
        <div className="text-base font-bold text-white font-mono">{data.formattedValue}</div>
        {data.rank && <div className="text-[10px] text-amber-400">Rank #{data.rank} of {data.totalUnits}</div>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="bg-slate-800/80 p-1.5 rounded">Pop: <span className="font-bold">{data.properties?.total_population?.toLocaleString() || 'N/A'}</span></div>
        <div className="bg-slate-800/80 p-1.5 rounded">Density: <span className="font-bold">{data.properties?.population_density || 'N/A'} /km²</span></div>
      </div>
      <div className="mt-2 text-[10px] text-slate-400">Urban: {data.properties?.pct_urban}% | Rural: {data.properties?.pct_rural}%</div>
    </div>
  );
};
