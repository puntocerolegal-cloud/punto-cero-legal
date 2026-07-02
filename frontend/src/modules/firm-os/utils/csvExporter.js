import Papa from 'papaparse';

export function exportToCSV(data, fileName) {
  if (!data || (!data.headers && !data.rows)) {
    console.warn('No data to export');
    return;
  }

  const { headers = [], rows = [], summary = {} } = data;

  const csvContent = Papa.unparse({
    fields: headers,
    data: rows,
  });

  const summaryContent = Object.entries(summary)
    .map(([key, value]) => `${key},${value}`)
    .join('\n');

  const fullContent = summaryContent 
    ? `${csvContent}\n\n,\nResumen,\n${summaryContent}`
    : csvContent;

  downloadFile(fullContent, fileName, 'text/csv;charset=utf-8;');
}

export function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
