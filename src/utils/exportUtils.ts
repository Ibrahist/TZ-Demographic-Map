import html2canvas from 'html2canvas';

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  
  // Extract keys excluding complex geometry
  const keys = Object.keys(data[0]).filter(k => k !== 'geometry');
  
  const csvRows: string[] = [];
  // Header row
  csvRows.push(keys.map(k => `"${k}"`).join(','));
  
  // Data rows
  for (const item of data) {
    const row = keys.map(k => {
      let val = item[k];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'string') {
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      }
      return `"${val}"`;
    });
    csvRows.push(row.join(','));
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportMapToPNG(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for PNG export.`);
    return;
  }
  
  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 2, // High resolution
      backgroundColor: '#0f172a'
    });
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = image;
    link.click();
  } catch (err) {
    console.error('Failed to export map as PNG:', err);
  }
}

