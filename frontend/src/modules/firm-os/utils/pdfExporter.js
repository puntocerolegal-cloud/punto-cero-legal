import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_NAME = 'PUNTO CERO LEGAL';
const COLORS = {
  primary: '#1e293b',
  accent: '#3b82f6',
  border: '#e2e8f0',
  text: '#0f172a',
  textLight: '#64748b',
};

export function exportToPDF(data, fileName, reportTitle = 'Reporte Ejecutivo', metadata = {}) {
  if (!data || (!data.headers && !data.rows)) {
    console.warn('No data to export');
    return;
  }

  const { headers = [], rows = [], summary = {} } = data;
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  addHeader(doc, reportTitle, metadata);
  yPosition += 25;

  // Summary section
  if (Object.keys(summary).length > 0) {
    yPosition = addSummarySection(doc, summary, yPosition);
    yPosition += 5;
  }

  // Data table
  if (headers.length > 0 && rows.length > 0) {
    yPosition = addTable(doc, headers, rows, yPosition);
  }

  // Footer
  addFooter(doc, fileName);

  doc.save(fileName);
}

function addHeader(doc, title, metadata = {}) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company name
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text);
  doc.setFont(undefined, 'bold');
  doc.text(COMPANY_NAME, 20, 20);

  // Report title
  doc.setFontSize(18);
  doc.setTextColor(COLORS.primary);
  doc.setFont(undefined, 'bold');
  doc.text(title, 20, 32);

  // Date and time on right
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textLight);
  doc.setFont(undefined, 'normal');
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES');
  const timeStr = now.toLocaleTimeString('es-ES');
  doc.text(`${dateStr} ${timeStr}`, pageWidth - 20, 20, { align: 'right' });

  // Metadata
  if (metadata.company || metadata.user) {
    doc.setFontSize(9);
    const metadataY = 38;
    if (metadata.company) doc.text(`Empresa: ${metadata.company}`, 20, metadataY);
    if (metadata.user) doc.text(`Usuario: ${metadata.user}`, 20, metadataY + 5);
  }

  // Separator line
  doc.setDrawColor(COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
}

function addSummarySection(doc, summary, startY) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const summaryData = Object.entries(summary).slice(0, 4);
  const itemWidth = (pageWidth - 40) / Math.min(summaryData.length, 4);

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(COLORS.primary);
  doc.text('Resumen Ejecutivo', 20, startY);

  let xPosition = 20;
  summaryData.forEach(([key, value]) => {
    const boxY = startY + 8;
    const boxHeight = 18;

    // Box background
    doc.setFillColor(245, 247, 250);
    doc.rect(xPosition, boxY, itemWidth - 2, boxHeight, 'F');

    // Border
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.rect(xPosition, boxY, itemWidth - 2, boxHeight);

    // Label
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);
    doc.setFont(undefined, 'normal');
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .substring(0, 12);
    doc.text(label, xPosition + 3, boxY + 5);

    // Value
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.setFont(undefined, 'bold');
    doc.text(String(value || 'N/A').substring(0, 10), xPosition + 3, boxY + 13);

    xPosition += itemWidth;
  });

  return startY + 32;
}

function addTable(doc, headers, rows, startY) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxTableHeight = pageHeight - startY - 30;

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY,
    margin: { top: margin, left: margin, right: margin, bottom: margin },
    maxTableHeight,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: '#ffffff',
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
      valign: 'middle',
      padding: 4,
    },
    bodyStyles: {
      textColor: COLORS.text,
      fontSize: 9,
      halign: 'left',
      valign: 'middle',
      padding: 3,
    },
    alternateRowStyles: {
      fillColor: 250,
    },
    didDrawPage: (data) => {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      const pageWidth = pageSize.getWidth();

      // Footer on each page
      const pageCount = doc.internal.pages.length - 1;
      const totalPages = doc.internal.pages.length - 1;
      
      doc.setFontSize(8);
      doc.setTextColor(COLORS.textLight);
      doc.text(
        `Página ${pageCount} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  return doc.lastAutoTable.finalY || startY + 50;
}

function addFooter(doc, fileName) {
  const pageCount = doc.internal.pages.length - 1;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);
    doc.text(
      `${COMPANY_NAME} - Firm OS - ${new Date().getFullYear()}`,
      20,
      pageHeight - 10
    );

    doc.text(
      `${i} de ${pageCount}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    );
  }
}
