import * as ss from 'simple-statistics';
import * as d3Chromatic from 'd3-scale-chromatic';
import { ColorScaleMethod, PaletteName } from '@/types';

export const PALETTES: Record<PaletteName, { label: string; isColorBlindSafe: boolean; interpolator: (t: number) => string }> = {
  Viridis: { label: 'Viridis (Color-Blind Safe)', isColorBlindSafe: true, interpolator: d3Chromatic.interpolateViridis },
  Cividis: { label: 'Cividis (Color-Blind Safe)', isColorBlindSafe: true, interpolator: d3Chromatic.interpolateCividis },
  Magma: { label: 'Magma (Color-Blind Safe)', isColorBlindSafe: true, interpolator: d3Chromatic.interpolateMagma },
  Plasma: { label: 'Plasma (Color-Blind Safe)', isColorBlindSafe: true, interpolator: d3Chromatic.interpolatePlasma },
  Blues: { label: 'Blues (Sequential)', isColorBlindSafe: false, interpolator: d3Chromatic.interpolateBlues },
  Greens: { label: 'Greens (Sequential)', isColorBlindSafe: false, interpolator: d3Chromatic.interpolateGreens },
  YlOrRd: { label: 'Yellow-Orange-Red', isColorBlindSafe: false, interpolator: d3Chromatic.interpolateYlOrRd },
  Purples: { label: 'Purples (Sequential)', isColorBlindSafe: false, interpolator: d3Chromatic.interpolatePurples }
};

export interface ColorScaleResult {
  breaks: number[];
  colors: string[];
  getColor: (val: number | null | undefined) => string;
  min: number;
  max: number;
}

export function computeColorScale(
  values: number[],
  method: ColorScaleMethod = 'natural_breaks',
  paletteName: PaletteName = 'Viridis',
  numClasses: number = 5
): ColorScaleResult {
  const cleanValues = values.filter(v => v !== null && v !== undefined && !isNaN(v)).sort((a, b) => a - b);
  
  if (cleanValues.length === 0) {
    return {
      breaks: [0, 1],
      colors: ['#cbd5e1'],
      getColor: () => '#9ca3af',
      min: 0,
      max: 0
    };
  }

  const min = cleanValues[0];
  const max = cleanValues[cleanValues.length - 1];

  // If min == max, return single color
  if (min === max) {
    const color = PALETTES[paletteName].interpolator(0.5);
    return {
      breaks: [min, max],
      colors: [color],
      getColor: (val) => (val !== null && val !== undefined ? color : '#9ca3af'),
      min,
      max
    };
  }

  // Generate class colors
  const palette = PALETTES[paletteName] || PALETTES.Viridis;
  const colors: string[] = [];
  for (let i = 0; i < numClasses; i++) {
    // Offset slightly so endpoints aren't completely white/black
    const t = 0.15 + (i / (numClasses - 1)) * 0.75;
    colors.push(palette.interpolator(t));
  }

  let breaks: number[] = [];

  try {
    if (method === 'natural_breaks') {
      // Natural Breaks (Jenks/ckmeans)
      if (cleanValues.length > numClasses) {
        const clusters = ss.ckmeans(cleanValues, numClasses);
        breaks = [min, ...clusters.map(cluster => cluster[cluster.length - 1])];
      } else {
        breaks = [min, max];
      }
    } else if (method === 'quantile') {
      // Quantile Breaks
      breaks = [min];
      for (let i = 1; i <= numClasses; i++) {
        const p = i / numClasses;
        breaks.push(ss.quantile(cleanValues, p));
      }
    } else {
      // Equal interval
      const step = (max - min) / numClasses;
      breaks = [min];
      for (let i = 1; i <= numClasses; i++) {
        breaks.push(min + i * step);
      }
    }
  } catch (err) {
    // Fallback to equal interval if ckmeans fails
    const step = (max - min) / numClasses;
    breaks = [min];
    for (let i = 1; i <= numClasses; i++) {
      breaks.push(min + i * step);
    }
  }

  // Ensure strict ascending breaks
  for (let i = 1; i < breaks.length; i++) {
    if (breaks[i] <= breaks[i - 1]) {
      breaks[i] = breaks[i - 1] + 0.0001;
    }
  }

  const getColor = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) {
      return '#9ca3af'; // Missing data: neutral grey
    }
    for (let i = 1; i < breaks.length; i++) {
      if (val <= breaks[i]) {
        return colors[i - 1] || colors[0];
      }
    }
    return colors[colors.length - 1];
  };

  return { breaks, colors, getColor, min, max };
}

