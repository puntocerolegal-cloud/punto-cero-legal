import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Folder, Upload, Search, Download, Eye, Trash2, FolderPlus, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const folderColors = ['#3b82f6', '#f97316', '#ec4899', '#10b981', '#8b5cf6'];

export const DocumentsPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [docsRes, foldersRes, storageRes] = await Promise.all([
        axios.get(`${API}/documents/?lawyer_id=${user.id}`),
        axios.get(`${API}/documents/folders/${user.id}`),
        axios.get(`${API}/documents/storage/${user.id}`),
      ]);
      setDocuments(docsRes.data);
      setFolders(foldersRes.data);
      setStorage(storageRes.data);
    } catch (e) {
      console.error('Error cargando documentos:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = documents.filter(d => (d.name || '').toLowerCase().includes(search.toLowerCase()));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await axios.post(`${API}/documents/`, {
        lawyer_id: user.id,
        name: file.name,
        size_bytes: file.size,
        folder: 'Casos Activos',
      });
      await loadData();
    } catch (err) {
      console.error('Error subiendo documento:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/documents/${id}`);
      setDocuments(prev => prev.filter(d => d._id !== id));
      loadData();
    } catch (err) {
      console.error('Error eliminando documento:', err);
    }
  };

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
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} data-testid="file-input" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold" data-testid="upload-doc">
              <Upload className="w-4 h-4 mr-2" /> {uploading ? 'Subiendo...' : 'Subir'}
            </Button>
          </div>
        </div>

        {/* Storage Info */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#3b82f6]/10 to-[#f97316]/10 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Almacenamiento utilizado</span>
            <span className="text-sm text-white/60">{storage ? `${storage.used_human} de ${storage.quota_human}` : '—'}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#3b82f6] to-[#f97316]" style={{ width: `${Math.min(storage?.percent || 0, 100)}%` }} />
          </div>
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Carpetas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {folders.map((f, i) => (
                <motion.div key={f.name} whileHover={{ scale: 1.05 }} className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 cursor-pointer">
                  <Folder className="w-10 h-10 mb-2" style={{ color: folderColors[i % folderColors.length] }} />
                  <div className="font-semibold text-sm">{f.name}</div>
                  <div className="text-xs text-white/60">{f.count} documentos</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

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
                  <tr key={doc._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: doc.type === 'pdf' ? '#ef444420' : '#3b82f620' }}>
                          <FileText className="w-5 h-5" style={{ color: doc.type === 'pdf' ? '#ef4444' : '#3b82f6' }} />
                        </div>
                        <div className="font-medium flex items-center gap-2">
                          {doc.name}
                          {doc.encrypted && <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" title="Cifrado Zero-Knowledge" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{doc.client}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{doc.size}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{doc.date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-white/10"><Eye className="w-4 h-4 text-[#3b82f6]" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-[#10b981]" /></button>
                        <button onClick={() => handleDelete(doc._id)} className="p-1.5 rounded-lg hover:bg-white/10" data-testid={`delete-doc-${doc._id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="text-center py-8 text-white/50">Cargando documentos...</div>}
            {!loading && filtered.length === 0 && <div className="text-center py-8 text-white/50">No hay documentos. Sube tu primer archivo.</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentsPage;
