import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, X } from 'lucide-react';

export function ExportButton({ exportViewModel, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef(null);

  const { exportFunctions, reportTitle } = exportViewModel;

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      if (format === 'csv') {
        exportFunctions.toCSV();
      } else if (format === 'pdf') {
        exportFunctions.toPDF();
      }
      setIsOpen(false);
      
      // Show toast-like notification
      setTimeout(() => setExporting(false), 500);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      setExporting(false);
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors text-white font-semibold text-sm"
      >
        {exporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Exportar
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && !exporting && (
        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-white/10 overflow-hidden z-50 min-w-[200px]">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-600">{reportTitle}</p>
          </div>

          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm text-slate-700 hover:text-slate-900 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-medium">CSV</p>
              <p className="text-xs text-slate-500">Excel, Sheets, LibreOffice</p>
            </div>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm text-slate-700 hover:text-slate-900 transition-colors border-t border-slate-200"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <div>
              <p className="font-medium">PDF</p>
              <p className="text-xs text-slate-500">Corporativo Punto Cero</p>
            </div>
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-left px-4 py-2 text-xs text-slate-500 hover:text-slate-700 border-t border-slate-200 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
