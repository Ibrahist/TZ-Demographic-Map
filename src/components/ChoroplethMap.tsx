'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  AdminLevel, 
  IndicatorMeta, 
  HoverTooltipData, 
  FeatureProperties 
} from '@/types';
import { ColorScaleResult } from '@/utils/colorScales';
import { formatIndicatorValue } from '@/utils/formatters';
import { Key, AlertTriangle } from 'lucide-react';

interface ChoroplethMapProps {
  apiKey: string;
  onOpenApiKeyModal: () => void;
  geojsonData: any;
  currentLevel: AdminLevel;
  indicator: IndicatorMeta;
  colorScale: ColorScaleResult;
  opacity: number;
  isDarkMode: boolean;
  onSelectFeature: (properties: FeatureProperties) => void;
  onHoverFeature: React.Dispatch<React.SetStateAction<HoverTooltipData | null>>;
  targetBounds?: any;
  villagePoints?: any;
}

// Google Maps Dark Style
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#142928' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#475569' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#09182b' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }]
  }
];

export const ChoroplethMap: React.FC<ChoroplethMapProps> = ({
  apiKey,
  onOpenApiKeyModal,
  geojsonData,
  currentLevel,
  indicator,
  colorScale,
  opacity,
  isDarkMode,
  onSelectFeature,
  onHoverFeature,
  targetBounds,
  villagePoints
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const hoveredFeatureRef = useRef<google.maps.Data.Feature | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Load Google Maps Script
  useEffect(() => {
    if (!apiKey) {
      setMapLoaded(false);
      return;
    }

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }

    window.gm_authFailure = () => {
      console.error('Google Maps authentication failed. Please check your API key.');
      setApiError(true);
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setApiError(false);
      setMapLoaded(true);
    };
    script.onerror = () => {
      setApiError(true);
    };
    document.head.appendChild(script);

    return () => {
      delete window.gm_authFailure;
    };
  }, [apiKey]);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Center on Tanzania
    const tanzaniaCenter = { lat: -6.369028, lng: 34.888822 };
    const map = new google.maps.Map(mapRef.current, {
      center: tanzaniaCenter,
      zoom: 6,
      minZoom: 5,
      maxZoom: 16,
      mapTypeId: 'roadmap',
      styles: isDarkMode ? DARK_MAP_STYLE : [],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
  }, [mapLoaded]);

  // Update Map Theme
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setOptions({
      styles: isDarkMode ? DARK_MAP_STYLE : []
    });
  }, [isDarkMode]);

  // Zoom to Target Bounds when drill-down changes
  useEffect(() => {
    if (!mapInstanceRef.current || !targetBounds) return;
    mapInstanceRef.current.fitBounds(targetBounds);
  }, [targetBounds]);

  // Render GeoJSON Data Layer & Styling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing GeoJSON data features
    map.data.forEach((feature) => {
      map.data.remove(feature);
    });

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (!geojsonData || !geojsonData.features) return;

    // Rank calculation for tooltip
    const valMap: { [pcode: string]: number } = {};
    const validPairs: { pcode: string; val: number }[] = [];
    geojsonData.features.forEach((f: any) => {
      const p = f.properties;
      const v = p[indicator.id];
      if (v !== null && v !== undefined && !isNaN(v)) {
        valMap[p.pcode] = Number(v);
        validPairs.push({ pcode: p.pcode, val: Number(v) });
      }
    });

    // Sort descending for rank
    validPairs.sort((a, b) => b.val - a.val);
    const ranks: { [pcode: string]: number } = {};
    validPairs.forEach((pair, index) => {
      ranks[pair.pcode] = index + 1;
    });

    // Add GeoJSON to Data layer
    map.data.addGeoJson(geojsonData);

    // Apply choropleth style
    map.data.setStyle((feature) => {
      const rawVal = feature.getProperty(indicator.id);
      const val = rawVal !== null && rawVal !== undefined ? Number(rawVal) : null;
      const isHovered = feature === hoveredFeatureRef.current;
      const fillColor = colorScale.getColor(val);

      return {
        fillColor,
        fillOpacity: opacity,
        strokeColor: isHovered ? '#ffffff' : (isDarkMode ? '#475569' : '#334155'),
        strokeWeight: isHovered ? 2.5 : 0.8,
        zIndex: isHovered ? 10 : 1,
      };
    });

    // Event Listeners
    const mouseOverListener = map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
      hoveredFeatureRef.current = event.feature;
      map.data.revertStyle();
      map.data.overrideStyle(event.feature, {
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
        zIndex: 10
      });

      const featureProps: Record<string, any> = {};
      event.feature.forEachProperty((val, prop) => {
        featureProps[prop] = val;
      });

      const allProps: Record<string, any> = {};
      event.feature.forEachProperty((val, prop) => {
        allProps[prop] = val;
      });

      const pcode = (event.feature.getProperty('pcode') as string) || '';
      const name = (event.feature.getProperty('name') as string) || '';
      const level = (event.feature.getProperty('level') as AdminLevel) || currentLevel;
      const rawVal = event.feature.getProperty(indicator.id);
      const val = rawVal !== null && rawVal !== undefined ? Number(rawVal) : null;
      const parentName = (event.feature.getProperty('parent_district_name') || event.feature.getProperty('parent_region_name')) as string | undefined;

      const clientX = (event.domEvent as MouseEvent)?.clientX || 200;
      const clientY = (event.domEvent as MouseEvent)?.clientY || 200;

      onHoverFeature({
        name,
        pcode,
        level,
        parentName,
        indicatorLabel: indicator.label,
        value: val,
        formattedValue: formatIndicatorValue(val, indicator.format, indicator.unit),
        unit: indicator.unit,
        rank: ranks[pcode],
        totalUnits: validPairs.length,
        x: clientX,
        y: clientY,
        properties: featureProps as FeatureProperties
      });
    });

    const mouseOutListener = map.data.addListener('mouseout', () => {
      hoveredFeatureRef.current = null;
      map.data.revertStyle();
      onHoverFeature(null);
    });

    const mouseMoveListener = map.data.addListener('mousemove', (event: google.maps.Data.MouseEvent) => {
      if (event.domEvent) {
        const mouseEv = event.domEvent as MouseEvent;
        onHoverFeature((prev) => prev ? { ...prev, x: mouseEv.clientX, y: mouseEv.clientY } : null);
      }
    });

    const clickListener = map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
      // Zoom into clicked feature
      const bounds = new google.maps.LatLngBounds();
      event.feature.getGeometry()?.forEachLatLng((latlng) => {
        bounds.extend(latlng);
      });
      map.fitBounds(bounds);

      // Collect properties and fire drill-down
      const pcode = (event.feature.getProperty('pcode') as string) || '';
      const name = (event.feature.getProperty('name') as string) || '';
      const level = (event.feature.getProperty('level') as AdminLevel) || currentLevel;
      const parentRegionName = (event.feature.getProperty('parent_region_name') as string) || undefined;
      const parentRegionPcode = (event.feature.getProperty('parent_region_pcode') as string) || undefined;
      const parentDistrictName = (event.feature.getProperty('parent_district_name') as string) || undefined;
      const parentDistrictPcode = (event.feature.getProperty('parent_district_pcode') as string) || undefined;

      onSelectFeature({
        ...allProps,
        pcode,
        name,
        level,
        parentRegionName,
        parentRegionPcode,
        parentDistrictName,
        parentDistrictPcode
      });
    });

    // If village points are provided in village mode, render them as markers
    if (currentLevel === 'village' && villagePoints && villagePoints.features) {
      villagePoints.features.forEach((f: any) => {
        const coords = f.geometry.coordinates;
        if (!coords || coords.length < 2) return;
        const lat = coords[1];
        const lng = coords[0];
        const name = f.properties.name || 'Village';

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 4,
            fillColor: '#10b981',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 1
          }
        });

        marker.addListener('click', () => {
          map.setZoom(13);
          map.panTo({ lat, lng });
          onSelectFeature({
            ...f.properties,
            level: 'village',
            latitude: lat,
            longitude: lng,
            name: f.properties.name || name
          });
        });

        marker.addListener('mouseover', (e: google.maps.MapMouseEvent) => {
          const domEv = e.domEvent as MouseEvent | undefined;
          onHoverFeature({
            name,
            pcode: f.properties.adm3_pcode || f.properties.id || '',
            level: 'village',
            parentName: f.properties.adm3_name ? `${f.properties.adm3_name} Ward, ${f.properties.adm2_name}` : f.properties.adm2_name,
            indicatorLabel: 'Settlement Classification',
            value: null,
            formattedValue: (f.properties.place || 'village').toUpperCase(),
            unit: '',
            x: domEv?.clientX || 200,
            y: domEv?.clientY || 200,
            properties: f.properties
          });
        });

        marker.addListener('mouseout', () => {
          onHoverFeature(null);
        });

        markersRef.current.push(marker);
      });
    }

    return () => {
      google.maps.event.removeListener(mouseOverListener);
      google.maps.event.removeListener(mouseOutListener);
      google.maps.event.removeListener(mouseMoveListener);
      google.maps.event.removeListener(clickListener);
    };
  }, [geojsonData, villagePoints, currentLevel, indicator, colorScale, opacity, isDarkMode, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1">
      {/* Map Container */}
      <div id="choropleth-map-canvas" ref={mapRef} className="w-full h-full min-h-[500px]" />

      {/* API Key Missing / Required Banner */}
      {!apiKey && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-md">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Google Maps API Key Required</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              To render the interactive Google Maps choropleth data layer and spatial drill-down, 
              please provide your Google Maps JavaScript API key.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                onClick={onOpenApiKeyModal}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow transition-all flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Key className="w-4 h-4" />
                <span>Enter Google Maps API Key</span>
              </button>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              Or set <code className="text-emerald-300 font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment.
            </div>
          </div>
        </div>
      )}

      {/* API Authentication Error Notification */}
      {apiError && apiKey && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-rose-950 border border-rose-700 rounded-xl px-4 py-3 shadow-xl text-rose-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Google Maps API authentication failed. Verify API key restrictions and Maps JavaScript API enablement.</span>
          <button
            onClick={onOpenApiKeyModal}
            className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-600 font-semibold text-xs ml-2 transition"
          >
            Update Key
          </button>
        </div>
      )}
    </div>
  );
};
