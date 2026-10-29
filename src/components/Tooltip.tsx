'use client';

import React, { useEffect, useState, useRef } from 'react';
import { HoverTooltipData } from '@/types';
import { 
  Trophy, 
  MapPin, 
  Users, 
  Maximize2, 
  Home, 
  TrendingUp, 
  Activity, 
  GraduationCap, 
  Zap, 
  Droplet, 
  Sparkles, 
  MousePointerClick,
  Scale
} from 'lucide-react';

interface TooltipProps {
  data: HoverTooltipData | null;
}

export const Tooltip: React.FC<TooltipProps> = ({ data }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!data) return;

    const width = 340;
    const height = 480;
    const padding = 16;

    let posX = data.x + padding;
    let posY = data.y + padding;

    // Check right edge
    if (typeof window !== 'undefined') {
      if (posX + width > window.innerWidth) {
        posX = Math.max(padding, data.x - width - padding);
      }
      // Check bottom edge
      if (posY + height > window.innerHeight) {
        posY = Math.max(padding, window.innerHeight - height - padding);
      }
    }

    setCoords({ x: posX, y: posY });
  }, [data]);

  if (!data) return null;

  const p = data.properties || ({} as any);

  const levelBadgeColor: Record<string, string> = {
    region: 'bg-blue-900/60 text-blue-300 border-blue-600/50',
    district: 'bg-emerald-900/60 text-emerald-300 border-emerald-600/50',
    ward: 'bg-purple-900/60 text-purple-300 border-purple-600/50',
    village: 'bg-amber-900/60 text-amber-300 border-amber-600/50'
  };

  const nextLevelHint: Record<string, string> = {
    region: 'Click to drill down into districts',
    district: 'Click to drill down into wards & villages',
    ward: 'Click to zoom in on ward',
    village: 'Click to inspect settlement'
  };

  const hasDemographics = p.total_population !== undefined && p.total_population !== null;
  const hasUrbanRural = p.pct_urban !== undefined && p.pct_rural !== undefined;
  const hasAgeStructure = p.pct_under_15 !== undefined && p.pct_under_15 !== null;
  const hasDhsData = p.fertility_rate !== undefined || p.electricity_access_pct !== undefined || p.stunting_rate !== undefined;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none transition-transform duration-75 ease-out"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
      }}
    >
      <div className="w-[330px] bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-slate-100 text-xs divide-y divide-slate-800/80">
        
        {/* Header */}
        <div className="pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${levelBadgeColor[data.level] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
              {data.level}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {data.pcode}
            </span>
          </div>

          <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-1.5 truncate">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{data.name}</span>
          </h3>

          {data.parentName && (
            <div className="text-[11px] text-slate-400 mt-0.5 truncate pl-5">
              Part of <span className="text-slate-200 font-medium">{data.parentName}</span>
            </div>
          )}
        </div>

        {/* Selected Indicator Primary Spotlight */}
        <div className="py-2.5">
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-xl p-3 shadow-inner">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-emerald-400/90 font-bold">
              <span>{data.indicatorLabel}</span>
              {data.rank && data.totalUnits && (
                <div className="flex items-center space-x-1 bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50 font-mono">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>#{data.rank} of {data.totalUnits}</span>
                </div>
              )}
            </div>

            <div className="text-xl font-extrabold text-white mt-1 font-mono tracking-tight flex items-baseline space-x-1">
              <span>{data.formattedValue}</span>
            </div>
          </div>
        </div>

        {/* Core Population & Area Grid */}
        {hasDemographics && (
          <div className="py-2.5 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Population */}
              <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800/80">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Users className="w-3 h-3 text-sky-400" />
                  <span>Population</span>
                </div>
                <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                  {p.total_population?.toLocaleString()}
                </div>
              </div>

              {/* Density */}
              <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800/80">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Maximize2 className="w-3 h-3 text-amber-400" />
                  <span>Density</span>
                </div>
                <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                  {p.population_density ? `${p.population_density} / km²` : 'N/A'}
                </div>
              </div>

              {/* Households */}
              <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800/80">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Home className="w-3 h-3 text-purple-400" />
                  <span>Households</span>
                </div>
                <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                  {p.num_households?.toLocaleString() || 'N/A'}
                  {p.avg_household_size && (
                    <span className="text-[10px] text-slate-400 font-normal"> ({p.avg_household_size}/hh)</span>
                  )}
                </div>
              </div>

              {/* Area */}
              <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800/80">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>10-Yr Growth</span>
                </div>
                <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                  {p.growth_rate_2012_2022 !== undefined && p.growth_rate_2012_2022 !== null
                    ? `${p.growth_rate_2012_2022 > 0 ? '+' : ''}${p.growth_rate_2012_2022}% / yr`
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Urban vs Rural Distribution Bar */}
            {hasUrbanRural && (
              <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/60">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Urban: <strong className="text-sky-300 font-mono">{p.pct_urban}%</strong></span>
                  <span>Rural: <strong className="text-emerald-300 font-mono">{p.pct_rural}%</strong></span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-sky-500 h-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, Math.max(0, p.pct_urban))}%` }} 
                  />
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, Math.max(0, p.pct_rural))}%` }} 
                  />
                </div>
              </div>
            )}

            {/* Age Breakdown (if region) */}
            {hasAgeStructure && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Children (&lt;15): <strong className="text-slate-200 font-mono">{p.pct_under_15}%</strong></span>
                <span>Elderly (65+): <strong className="text-slate-200 font-mono">{p.pct_65_plus}%</strong></span>
                {p.sex_ratio && (
                  <span>Sex Ratio: <strong className="text-slate-200 font-mono">{p.sex_ratio}</strong></span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Infrastructure Highlights */}
        {(p.health_facilities_count !== undefined || p.schools_count !== undefined) && (
          <div className="py-2.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Infrastructure & Services
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  <strong className="text-white font-mono">{p.health_facilities_count ?? 0}</strong> Health Facilities
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  <strong className="text-white font-mono">{p.schools_count ?? 0}</strong> Schools
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Regional DHS Survey Metrics */}
        {data.level === 'region' && hasDhsData && (
          <div className="py-2.5 space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Regional Health & Living Standards (DHS 2022)
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {p.electricity_access_pct !== undefined && (
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 text-center">
                  <div className="text-amber-400 flex justify-center mb-0.5"><Zap className="w-3 h-3" /></div>
                  <div className="font-bold font-mono text-slate-200">{p.electricity_access_pct}%</div>
                  <div className="text-[8px] text-slate-500">Electricity</div>
                </div>
              )}
              {p.improved_water_pct !== undefined && (
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 text-center">
                  <div className="text-sky-400 flex justify-center mb-0.5"><Droplet className="w-3 h-3" /></div>
                  <div className="font-bold font-mono text-slate-200">{p.improved_water_pct}%</div>
                  <div className="text-[8px] text-slate-500">Water</div>
                </div>
              )}
              {p.fertility_rate !== undefined && (
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 text-center">
                  <div className="text-pink-400 flex justify-center mb-0.5"><Sparkles className="w-3 h-3" /></div>
                  <div className="font-bold font-mono text-slate-200">{p.fertility_rate}</div>
                  <div className="text-[8px] text-slate-500">TFR</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Click-to-Drill Guidance Footer */}
        <div className="pt-2 text-[10px] text-emerald-400/90 flex items-center justify-between font-medium">
          <div className="flex items-center space-x-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{nextLevelHint[data.level] || 'Click for details'}</span>
          </div>
          <span className="text-[9px] text-slate-500">NBS PHC 2022</span>
        </div>

      </div>
    </div>
  );
};
