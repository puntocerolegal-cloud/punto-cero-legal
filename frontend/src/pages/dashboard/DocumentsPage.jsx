import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Folder, Upload, Search, Download, Eye, Trash2, MoreVertical, FolderPlus, Image as ImageIcon, FileType } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const folders = [
  { id: 1, name: 'Casos Activos', count: 24, color: '#3b82f6' },
  { id: 2, name: 'Contratos', count: 18, color: '#f97316' },
  { id: 3, name: 'Demandas', count: 12, color: '#ec4899' },
  { id: 4, name: 'Tutelas', count: 8, color: '#10b981' },
  { id: 5, name: 'Plantillas', count: 35, color: '#8b5cf6' },
];

const documents = [
  { id: 1, name: 'Demanda_Gonzalez_v1.pdf', type: 'pdf', size: '2.4 MB', date: '2025-12-10', client: 'María González' },
  { id: 2, name: 'Contrato_Servicios_Mendoza.docx', type: 'doc', size: '845 KB', date: '2025-12-09', client: 'Carlos Mendoza' },
  { id: 3, name: 'Tutela_Educacion_Torres.pdf', type: 'pdf', size: '1.2 MB', date: '2025-12-08', client: 'Luis Torres' },
  { id: 4, name: 'Poder_Especial_Rodriguez.pdf', type: 'pdf', size: '512 KB', date: '2025-12-07', client: 'Ana Rodríguez' },
  { id: 5, name: 'Acta_Audiencia_001.pdf', type: 'pdf', size: '3.1 MB', date: '2025-12-06', client: '—' },
];

export const DocumentsPage = () => {
  const [search, setSearch] = useState('');
  const filtered = documents.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Documentos</h1>
            <p className="text-white/60">Gestor documental seguro con versionado automático</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" data-testid="new-folder">
              <FolderPlus className="w-4 h-4 mr-2" /> Carpeta
            </Button>
            <Button className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold" data-testid="upload-doc">
              <Upload className="w-4 h-4 mr-2" /> Subir
            </Button>
          </div>
        </div>

        {/* Storage Info */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#3b82f6]/10 to-[#f97316]/10 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Almacenamiento utilizado</span>
            <span className="text-sm text-white/60">12.5 GB de 50 GB</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#3b82f6] to-[#f97316]" style={{ width: '25%' }} />
          </div>
        </div>

        {/* Folders */}
        <div>
          <h2 className="text-xl font-bold mb-4">Carpetas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {folders.map(f => (
              <motion.div key={f.id} whileHover={{ scale: 1.05 }} className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 cursor-pointer">
                <Folder className="w-10 h-10 mb-2" style={{ color: f.color }} />
                <div className="font-semibold text-sm">{f.name}</div>
                <div className="text-xs text-white/60">{f.count} documentos</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar documentos..." className="bg-white/10 border-white/20 text-white pl-10" data-testid="search-doc" />
        </div>

        {/* Documents List */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-left text-xs uppercase text-white/60">
                  <th className="px-4 py-3">Archivo</th>
                  <th className="px-4 py-3 hidden md:table-cell">Cliente</th>
                  <th className="px-4 py-3 hidden md:table-cell">Tamaño</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: doc.type === 'pdf' ? '#ef444420' : '#3b82f620' }}>
                          <FileText className="w-5 h-5" style={{ color: doc.type === 'pdf' ? '#ef4444' : '#3b82f6' }} />
                        </div>
                        <div className="font-medium">{doc.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{doc.client}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{doc.size}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{doc.date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-white/10"><Eye className="w-4 h-4 text-[#3b82f6]" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-[#10b981]" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-white/10"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentsPage;
