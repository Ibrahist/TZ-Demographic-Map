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
    </div>
  );
};
