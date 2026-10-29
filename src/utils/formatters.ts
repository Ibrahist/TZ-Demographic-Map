export function formatIndicatorValue(value: number | null | undefined, format: string, unit: string): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  let formatted = '';
  switch (format) {
    case 'integer':
      formatted = Math.round(value).toLocaleString();
      break;
    case 'decimal1':
      formatted = value.toFixed(1);
      break;
    case 'percent1':
      formatted = `${value.toFixed(1)}%`;
      return formatted;
    default:
      formatted = value.toLocaleString();
  }
  
  if (unit && unit !== '%' && !unit.includes('people')) {
    return `${formatted} ${unit}`;
  }
  return formatted;
}

