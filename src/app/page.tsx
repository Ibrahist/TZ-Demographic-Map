'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  AdminLevel, 
  IndicatorMeta, 
  ColorScaleMethod, 
  PaletteName, 
  BreadcrumbItem, 
  HoverTooltipData, 
  FeatureProperties 
} from '@/types';
import { computeColorScale } from '@/utils/colorScales';
import { ControlPanel } from '@/components/ControlPanel';
import { SearchBar, SearchResultItem } from '@/components/SearchBar';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Legend } from '@/components/Legend';
import { Tooltip } from '@/components/Tooltip';
import { ExportButtons } from '@/components/ExportButtons';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { AreaExportModal } from '@/components/AreaExportModal';
import { MapPin, Key, Layers, Download, X } from 'lucide-react';

const ChoroplethMap = dynamic(
  () => import('@/components/ChoroplethMap').then((mod) => mod.ChoroplethMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Map Engine...</span>
        </div>
      </div>
    )
  }
);

export default function Home() {
  // Config & State
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [currentLevel, setCurrentLevel] = useState<AdminLevel>('region');
  const [indicators, setIndicators] = useState<IndicatorMeta[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorMeta | null>(null);
  const [scaleMethod, setScaleMethod] = useState<ColorScaleMethod>('natural_breaks');
  const [paletteName, setPaletteName] = useState<PaletteName>('Viridis');
  const [opacity, setOpacity] = useState<number>(0.75);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Drill-down Context State
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { level: 'national', name: 'Tanzania' }
  ]);
  const [activeRegion, setActiveRegion] = useState<{ pcode: string; name: string } | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<{ pcode: string; name: string } | null>(null);

  // Data Cache State
  const [regionsData, setRegionsData] = useState<any>(null);
  const [districtsData, setDistrictsData] = useState<any>(null);
  const [currentGeoJson, setCurrentGeoJson] = useState<any>(null);
  const [villagePoints, setVillagePoints] = useState<any>(null);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltipData | null>(null);
  const [searchUnits, setSearchUnits] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAreaExportModalOpen, setIsAreaExportModalOpen] = useState<boolean>(false);
  const [areaForExport, setAreaForExport] = useState<FeatureProperties | null>(null);

  // Initialize API Key from env or session
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const sessionKey = typeof window !== 'undefined' ? sessionStorage.getItem('gm_api_key') : null;
    const initialKey = envKey || sessionKey || '';
    setApiKey(initialKey);
    if (!initialKey) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gm_api_key', newKey);
    }
  };

  // Load Indicators Metadata and Base Datasets
  useEffect(() => {
    async function initData() {
      try {
        setIsLoading(true);
        // Load indicators
        const indRes = await fetch('/data/indicators_metadata.json');
        const indData = await indRes.json();
        setIndicators(indData);
        if (indData.length > 0) {
          setSelectedIndicator(indData[0]);
        }

        // Preload regions
        const regRes = await fetch('/data/regions.geojson');
        const regJson = await regRes.json();
        setRegionsData(regJson);
        setCurrentGeoJson(regJson);

        // Preload districts
        const disRes = await fetch('/data/districts.geojson');
        const disJson = await disRes.json();
        setDistrictsData(disJson);

        // Build Search Index
        const units: SearchResultItem[] = [];
        regJson.features.forEach((f: any) => {
          units.push({
            name: f.properties.name,
            pcode: f.properties.pcode,
            level: 'region'
          });
        });
        disJson.features.forEach((f: any) => {
          units.push({
            name: f.properties.name,
            pcode: f.properties.pcode,
            level: 'district',
            parentRegionName: f.properties.parent_region_name,
            parentRegionPcode: f.properties.parent_region_pcode
          });
        });
        setSearchUnits(units);
      } catch (err) {
        console.error('Failed to load initial GeoJSON data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Handle Level & Drill-down Data Switching (Lazy Loading)
  useEffect(() => {
    async function switchLevelData() {
      if (currentLevel === 'region') {
        if (regionsData) setCurrentGeoJson(regionsData);
        setVillagePoints(null);
      } else if (currentLevel === 'district') {
        if (districtsData) {
          if (activeRegion) {
            // Filter districts for the selected region
            const filteredFeatures = districtsData.features.filter(
              (f: any) => f.properties.parent_region_pcode === activeRegion.pcode
            );
            setCurrentGeoJson({ type: 'FeatureCollection', features: filteredFeatures });
          } else {
            setCurrentGeoJson(districtsData);
          }
        }
        setVillagePoints(null);
      } else if (currentLevel === 'ward') {
        // Lazy-load district ward partition if district selected, otherwise fall back to nationwide wards
        try {
          if (activeDistrict) {
            const url = `/data/wards_by_district/${activeDistrict.pcode}.geojson`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              setCurrentGeoJson(data);
            }
          } else {
            const res = await fetch('/data/wards.geojson');
            const data = await res.json();
            setCurrentGeoJson(data);
          }
        } catch (err) {
          console.error('Failed to load wards data:', err);
        }
        setVillagePoints(null);
      } else if (currentLevel === 'village') {
        // Lazy-load village points
        try {
          if (activeDistrict) {
            const url = `/data/villages_by_district/${activeDistrict.pcode}.geojson`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              setVillagePoints(data);
            }
          } else {
            const res = await fetch('/data/villages_points.geojson');
            const data = await res.json();
            setVillagePoints(data);
          }
        } catch (err) {
          console.error('Failed to load village points:', err);
        }
      }
    }
    switchLevelData();
  }, [currentLevel, activeRegion, activeDistrict, regionsData, districtsData]);

  // Compute Color Scale from Current View Values
  const colorScale = useMemo(() => {
    if (!currentGeoJson || !currentGeoJson.features || !selectedIndicator) {
      return computeColorScale([], scaleMethod, paletteName);
    }
    const vals = currentGeoJson.features
      .map((f: any) => f.properties[selectedIndicator.id])
      .filter((v: any) => v !== null && v !== undefined && !isNaN(v))
      .map((v: any) => Number(v));

    return computeColorScale(vals, scaleMethod, paletteName);
  }, [currentGeoJson, selectedIndicator, scaleMethod, paletteName]);

  // Feature Click / Drill-down Handler
  const handleSelectFeature = useCallback((props: FeatureProperties) => {
    setAreaForExport(props);
    if (currentLevel === 'region') {
      // Drill down into District level
      setActiveRegion({ pcode: props.pcode, name: props.name });
      setBreadcrumbs([
        { level: 'national', name: 'Tanzania' },
        { level: 'region', name: props.name, pcode: props.pcode }
      ]);
      setCurrentLevel('district');
    } else if (currentLevel === 'district') {
      // Drill down into Ward level
      setActiveDistrict({ pcode: props.pcode, name: props.name });
      setBreadcrumbs([
        { level: 'national', name: 'Tanzania' },
        { 
          level: 'region', 
          name: props.parent_region_name || activeRegion?.name || 'Region', 
          pcode: props.parent_region_pcode || activeRegion?.pcode 
        },
        { level: 'district', name: props.name, pcode: props.pcode }
      ]);
      setCurrentLevel('ward');
    } else if (currentLevel === 'ward') {
      // Set ward breadcrumb
      setBreadcrumbs((prev) => [
        ...prev.slice(0, 3),
        { level: 'ward', name: props.name, pcode: props.pcode }
      ]);
    }
  }, [currentLevel, activeRegion]);

  // Breadcrumb Navigation Handler
  const handleNavigateBreadcrumb = (index: number) => {
    if (index === 0) {
      // Reset to Tanzania Region View
      setActiveRegion(null);
      setActiveDistrict(null);
      setAreaForExport(null);
      setBreadcrumbs([{ level: 'national', name: 'Tanzania' }]);
      setCurrentLevel('region');
    } else if (index === 1) {
      // Navigate to Region's Districts
      const reg = breadcrumbs[1];
      setActiveRegion({ pcode: reg.pcode!, name: reg.name });
      setActiveDistrict(null);
      if (regionsData) {
        const found = regionsData.features?.find((f: any) => f.properties.pcode === reg.pcode);
        if (found) setAreaForExport(found.properties);
      }
      setBreadcrumbs([
        { level: 'national', name: 'Tanzania' },
        reg
      ]);
      setCurrentLevel('district');
    } else if (index === 2) {
      // Navigate to District's Wards
      const reg = breadcrumbs[1];
      const dis = breadcrumbs[2];
      setActiveRegion({ pcode: reg.pcode!, name: reg.name });
      setActiveDistrict({ pcode: dis.pcode!, name: dis.name });
      if (districtsData) {
        const found = districtsData.features?.find((f: any) => f.properties.pcode === dis.pcode);
        if (found) setAreaForExport(found.properties);
      }
      setBreadcrumbs([
        { level: 'national', name: 'Tanzania' },
        reg,
        dis
      ]);
      setCurrentLevel('ward');
    }
  };

  // Search Selection Handler
  const handleSelectSearchUnit = (item: SearchResultItem) => {
    let foundProps: any = null;
    if (item.level === 'region' && regionsData) {
      foundProps = regionsData.features?.find((f: any) => f.properties.pcode === item.pcode)?.properties;
    } else if (item.level === 'district' && districtsData) {
      foundProps = districtsData.features?.find((f: any) => f.properties.pcode === item.pcode)?.properties;
    }
    setAreaForExport(foundProps || {
      name: item.name,
      pcode: item.pcode,
      level: item.level,
      parent_region_name: item.parentRegionName,
      parent_region_pcode: item.parentRegionPcode
    });
    if (item.level === 'region') {
      setActiveRegion({ pcode: item.pcode, name: item.name });
      setActiveDistrict(null);
      setBreadcrumbs([
        { level: 'national', name: 'Tanzania' },
        { level: 'region', name: item.name, pcode: item.pcode }
      ]);
      setCurrentLevel('district');
    } else if (item.level === 'district') {
      setActiveRegion({ pcode: item.parentRegionPcode || '', name: item.parentRegionName || '' });
      setActiveDistrict({ pcode: item.pcode, name: item.name });
      setBreadcrumbs([
        { level: 'national', name: 'Tanzania' },
        { level: 'region', name: item.parentRegionName || 'Region', pcode: item.parentRegionPcode },
        { level: 'district', name: item.name, pcode: item.pcode }
      ]);
      setCurrentLevel('ward');
    }
  };

  // Features count
  const totalFeatures = currentGeoJson?.features?.length || 0;



  const methodLabels: Record<ColorScaleMethod, string> = {
    natural_breaks: 'Natural Breaks (Fisher-Jenks)',
    quantile: 'Quantiles',
    equal_interval: 'Equal Interval'
  };

  const handleOpenAreaExport = (area?: FeatureProperties | null) => {
    if (area) {
      setAreaForExport(area);
    } else if (!areaForExport) {
      if (activeDistrict && districtsData) {
        const match = districtsData.features?.find((f: any) => f.properties.pcode === activeDistrict.pcode);
        setAreaForExport(match ? match.properties : { name: activeDistrict.name, pcode: activeDistrict.pcode, level: 'district' });
      } else if (activeRegion && regionsData) {
        const match = regionsData.features?.find((f: any) => f.properties.pcode === activeRegion.pcode);
        setAreaForExport(match ? match.properties : { name: activeRegion.name, pcode: activeRegion.pcode, level: 'region' });
      } else if (currentGeoJson?.features?.[0]) {
        setAreaForExport(currentGeoJson.features[0].properties);
      }
    }
    setIsAreaExportModalOpen(true);
  };

  return (
    <main className="relative w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="z-30 h-14 bg-slate-900/75 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.08] px-4 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.12] backdrop-blur-md flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
            <img
              src="/tanzania.png"
              alt="Tanzania Logo"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight flex items-center space-x-1.5">
              <span>Tanzania Demographic Map</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-sm">
                2022 Census
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Interactive Subnational Choropleth & Drill-Down Visualization
            </div>
          </div>
        </div>

        {/* Search Bar in center */}
        <div className="hidden md:flex items-center mx-4 flex-1 max-w-sm">
          <SearchBar onSelectUnit={handleSelectSearchUnit} units={searchUnits} />
        </div>

        {/* Right side controls & export */}
        <div className="flex items-center space-x-2">
          <ExportButtons onOpenAreaExport={() => handleOpenAreaExport()} />

          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            title="Configure Google Maps API Key"
            className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] text-slate-200 border border-white/[0.12] backdrop-blur-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <Key className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </header>

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full h-[calc(100vh-56px)] overflow-hidden">
        {/* Full-width Map Canvas */}
        <ChoroplethMap
          apiKey={apiKey}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          geojsonData={currentGeoJson}
          currentLevel={currentLevel}
          indicator={selectedIndicator || { id: 'total_population', label: 'Population', unit: '', format: 'integer', category: '', description: '', available_levels: [], source: '', palette: '' }}
          colorScale={colorScale}
          opacity={opacity}
          isDarkMode={isDarkMode}
          onSelectFeature={handleSelectFeature}
          onHoverFeature={setHoverTooltip}
          villagePoints={villagePoints}
        />

        {/* Floating Top Breadcrumb trail & Mobile Search */}
        <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 pointer-events-auto max-w-[calc(100vw-32px)]">
          <Breadcrumbs
            breadcrumbs={breadcrumbs}
            onNavigate={handleNavigateBreadcrumb}
            onExportArea={(item) => {
              let found: any = null;
              if (item.level === 'region' && regionsData) {
                found = regionsData.features?.find((f: any) => f.properties.pcode === item.pcode || f.properties.name === item.name);
              } else if (item.level === 'district' && districtsData) {
                found = districtsData.features?.find((f: any) => f.properties.pcode === item.pcode || f.properties.name === item.name);
              } else if (item.level === 'ward' && currentGeoJson) {
                found = currentGeoJson.features?.find((f: any) => f.properties.pcode === item.pcode || f.properties.name === item.name);
              }
              handleOpenAreaExport(found ? found.properties : { name: item.name, pcode: item.pcode || '', level: item.level as AdminLevel });
            }}
          />
          <div className="md:hidden">
            <SearchBar onSelectUnit={handleSelectSearchUnit} units={searchUnits} />
          </div>
        </div>

        {/* Floating Left Control Panel */}
        <div className="absolute top-20 left-4 z-20 pointer-events-auto">
          {selectedIndicator && (
            <ControlPanel
              currentLevel={currentLevel}
              onChangeLevel={(lvl) => {
                setCurrentLevel(lvl);
                if (lvl === 'region') {
                  setActiveRegion(null);
                  setActiveDistrict(null);
                  setBreadcrumbs([{ level: 'national', name: 'Tanzania' }]);
                }
              }}
              indicators={indicators}
              selectedIndicator={selectedIndicator}
              onSelectIndicator={setSelectedIndicator}
              scaleMethod={scaleMethod}
              onChangeScaleMethod={setScaleMethod}
              paletteName={paletteName}
              onChangePalette={setPaletteName}
              opacity={opacity}
              onChangeOpacity={setOpacity}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              totalFeatures={totalFeatures}
            />
          )}
        </div>

        {/* Floating Bottom-Left Selected Area Quick-Export Card */}
        {areaForExport && (
          <div className="absolute bottom-6 left-4 z-20 pointer-events-auto bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-xl text-xs text-slate-100 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center space-x-1.5 pl-1">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold flex items-center space-x-1.5">
                  <span className="truncate max-w-[140px]">{areaForExport.name}</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {areaForExport.level}
                  </span>
                </div>
                {areaForExport.total_population && (
                  <div className="text-[10px] text-slate-400">
                    Pop: {Number(areaForExport.total_population).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-2.5">
              <button
                onClick={() => setIsAreaExportModalOpen(true)}
                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs shadow-sm transition flex items-center space-x-1"
                title="Export this area as CSV, PDF, or GeoJSON"
              >
                <Download className="w-3 h-3" />
                <span>Export Area</span>
              </button>

              <button
                onClick={() => setAreaForExport(null)}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Bottom-Right Legend */}
        {selectedIndicator && (
          <div className="absolute bottom-6 right-4 z-20 pointer-events-auto">
            <Legend
              colorScale={colorScale}
              indicator={selectedIndicator}
              methodLabel={methodLabels[scaleMethod]}
            />
          </div>
        )}

        {/* Hover Tooltip */}
        <Tooltip data={hoverTooltip} />
      </div>

      {/* Area Export Modal (CSV, PDF, GeoJSON) */}
      <AreaExportModal
        isOpen={isAreaExportModalOpen}
        onClose={() => setIsAreaExportModalOpen(false)}
        initialArea={areaForExport}
        currentLevel={currentLevel}
        regionsData={regionsData}
        districtsData={districtsData}
        currentGeoJson={currentGeoJson}
        villagePoints={villagePoints}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaveKey={handleSaveApiKey}
        currentKey={apiKey}
      />
    </main>
  );
}

