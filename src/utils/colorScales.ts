import {
  interpolateViridis,
  interpolateCividis,
  interpolateMagma,
  interpolatePlasma,
  interpolateBlues,
  interpolateGreens,
  interpolateYlOrRd,
  interpolatePurples
} from 'd3-scale-chromatic';
import { ColorScaleMethod, PaletteName } from '@/types';

export const PALETTES: Record<PaletteName, { label: string; isColorBlindSafe: boolean; interpolator: (t: number) => string }> = {
  Viridis: { label: 'Viridis (Color-Blind Safe)', isColorBlindSafe: true, interpolator: interpolateViridis },
  Cividis: { label: 'Cividis (Color-Blind Safe)', isColorBlindSafe: true, interpolator: interpolateCividis },
  Magma: { label: 'Magma (Color-Blind Safe)', isColorBlindSafe: true, interpolator: interpolateMagma },
  Plasma: { label: 'Plasma (Color-Blind Safe)', isColorBlindSafe: true, interpolator: interpolatePlasma },
  Blues: { label: 'Blues (Sequential)', isColorBlindSafe: false, interpolator: interpolateBlues },
  Greens: { label: 'Greens (Sequential)', isColorBlindSafe: false, interpolator: interpolateGreens },
  YlOrRd: { label: 'Yellow-Orange-Red', isColorBlindSafe: false, interpolator: interpolateYlOrRd },
  Purples: { label: 'Purples (Sequential)', isColorBlindSafe: false, interpolator: interpolatePurples }
};

export interface ColorScaleResult {
  breaks: number[];
  colors: string[];
  getColor: (val: number | null | undefined) => string;
  min: number;
  max: number;
}

/**
 * Fisher-Jenks Natural Breaks (1D ckmeans) implementation in pure TypeScript.
 * Groups values into classes that minimize variance within classes and maximize variance between classes.
 */
export function getJenksBreaks(sorted: number[], numClasses: number): number[] {
  const n = sorted.length;
  if (n === 0) return [0, 1];
  if (n <= numClasses) {
    const unique = Array.from(new Set(sorted));
    return unique.length === 1 ? [unique[0], unique[0]] : unique;
  }

  // Dynamic programming matrices
  const mat1: number[][] = Array.from({ length: n + 1 }, () => Array(numClasses + 1).fill(0));
  const mat2: number[][] = Array.from({ length: n + 1 }, () => Array(numClasses + 1).fill(0));

  for (let y = 1; y <= numClasses; y++) {
    mat1[1][y] = 1;
    mat2[1][y] = 0;
    for (let t = 2; t <= n; t++) {
      mat2[t][y] = Infinity;
    }
  }

  let v = 0;
  for (let l = 2; l <= n; l++) {
    let s1 = 0;
    let s2 = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const i3 = l - m + 1;
      const val = sorted[i3 - 1];
      s2 += val * val;
      s1 += val;
      w++;
      v = s2 - (s1 * s1) / w;
      const i4 = i3 - 1;
      if (i4 !== 0) {
        for (let j = 2; j <= numClasses; j++) {
          if (mat2[l][j] >= v + mat2[i4][j - 1]) {
            mat1[l][j] = i3;
            mat2[l][j] = v + mat2[i4][j - 1];
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = v;
  }

  let k = n;
  const kclass: number[] = Array(numClasses + 1).fill(0);
  kclass[numClasses] = sorted[n - 1];
  kclass[0] = sorted[0];

  for (let count = numClasses; count >= 2; count--) {
    const pivot = mat1[k][count] - 2;
    if (pivot >= 0 && pivot < sorted.length) {
      kclass[count - 1] = sorted[pivot];
    } else {
      kclass[count - 1] = sorted[0];
    }
    k = mat1[k][count] - 1;
  }

  return kclass;
}

/**
 * Computes quantile breaks with linear interpolation.
 */
export function getQuantileBreaks(sorted: number[], numClasses: number): number[] {
  const breaks: number[] = [sorted[0]];
  for (let i = 1; i <= numClasses; i++) {
    const p = i / numClasses;
    const idx = (sorted.length - 1) * p;
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    const weight = idx - low;
    const val = sorted[low] * (1 - weight) + sorted[high] * weight;
    breaks.push(val);
  }
  return breaks;
}

export function computeColorScale(
  values: number[],
  method: ColorScaleMethod = 'natural_breaks',
  paletteName: PaletteName = 'Viridis',
  numClasses: number = 5
): ColorScaleResult {
  const cleanValues = values
    .filter(v => v !== null && v !== undefined && !isNaN(v))
    .sort((a, b) => a - b);
  
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
    const palette = PALETTES[paletteName] || PALETTES.Viridis;
    const color = palette.interpolator(0.5);
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
      breaks = getJenksBreaks(cleanValues, numClasses);
    } else if (method === 'quantile') {
      breaks = getQuantileBreaks(cleanValues, numClasses);
    } else {
      // Equal interval
      const step = (max - min) / numClasses;
      breaks = [min];
      for (let i = 1; i <= numClasses; i++) {
        breaks.push(min + i * step);
      }
    }
  } catch {
    // Fallback to equal interval if calculation fails
    const step = (max - min) / numClasses;
    breaks = [min];
    for (let i = 1; i <= numClasses; i++) {
      breaks.push(min + i * step);
    }
  }

  // Ensure strict ascending breaks to avoid division by zero or out-of-order bins
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
