import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API } from '@/config/api';
import { TeamTable } from '../components/TeamTable';
import { TeamMemberModal } from '../components/TeamMemberModal';

export function FirmTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    byRole: {}
  });

  const [selectedMember, setSelectedMember] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [practiceAreas, setPracticeAreas] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firmId = user.firm_id;
  const token = localStorage.getItem('token');

  // Cargar equipo
  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!firmId) {
        setError('No tienes acceso a un equipo');
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API}/rbac/team/${firmId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const teamData = res.data.team || [];
      setTeam(teamData);

      // Calcular métricas
      const active = teamData.filter(m => m.status === 'ACTIVE' || m.status === 'active').length;
      const suspended = teamData.filter(m => m.status === 'suspended' || m.status === 'SUSPENDED').length;
      
      const byRole = {};
      teamData.forEach(m => {
        const role = m.role;
        byRole[role] = (byRole[role] || 0) + 1;
      });

      setMetrics({
        total: teamData.length,
        active,
        suspended,
        byRole
      });
    } catch (err) {
      console.error('Error loading team:', err);
      setError('Error al cargar el equipo');
    } finally {
      setLoading(false);
    }
  }, [firmId, token]);

  // Cargar áreas de práctica
  const loadPracticeAreas = useCallback(async () => {
    try {
      if (!firmId) return;

      const res = await axios.get(`${API}/firm-config/${firmId}/practice-areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPracticeAreas(res.data.data || []);
    } catch (err) {
      console.error('Error loading practice areas:', err);
    }
  }, [firmId, token]);

  useEffect(() => {
    loadTeam();
    loadPracticeAreas();
  }, [loadTeam, loadPracticeAreas]);

  // Suspender miembro
  const handleSuspend = async (member) => {
    if (!window.confirm(`¿Suspender a ${member.name || member.full_name}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.patch(
        `${API}/rbac/users/${member.id}/status`,
        { status: 'suspended' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTeam(prev => prev.map(m => 
        m.id === member.id ? { ...m, status: 'suspended' } : m
      ));
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al suspender miembro');
    } finally {
      setActionLoading(false);
    }
  };

  // Reactivar miembro
  const handleReactivate = async (member) => {
    if (!window.confirm(`¿Reactivar a ${member.name || member.full_name}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.patch(
        `${API}/rbac/users/${member.id}/status`,
        { status: 'ACTIVE' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTeam(prev => prev.map(m => 
        m.id === member.id ? { ...m, status: 'ACTIVE' } : m
      ));
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al reactivar miembro');
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modal de edición
  const handleEdit = (member) => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  // Guardar cambios
  const handleSaveChanges = (updatedMember) => {
    setTeam(prev => prev.map(m =>
      m.id === updatedMember.id ? updatedMember : m
    ));
  };

  // Filtrar equipo por búsqueda
  const filteredTeam = team.filter(member => {
    const query = searchQuery.toLowerCase();
    const name = (member.name || member.full_name || '').toLowerCase();
    const email = (member.email || '').toLowerCase();
    const role = (member.role || '').toLowerCase();
    
    return name.includes(query) || email.includes(query) || role.includes(query);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Total de Miembros</p>
          <p className="text-4xl font-bold text-white">{metrics.total}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Activos</p>
          <p className="text-4xl font-bold text-green-400">{metrics.active}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Suspendidos</p>
          <p className="text-4xl font-bold text-red-400">{metrics.suspended}</p>
        </div>
      </div>

      {/* Distribución por Rol */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Distribución por Rol
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics.byRole).map(([role, count]) => (
            <div key={role} className="text-center p-3 bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-400 uppercase">{role.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-white mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Encabezado y búsqueda */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-white">Equipo ({filteredTeam.length})</h1>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white font-semibold">
            <Plus className="w-5 h-5" />
            Invitar Miembro
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla de equipo */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-700 flex gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {actionLoading && (
        <div className="p-4 rounded-lg bg-blue-900/30 border border-blue-700 flex gap-2 text-blue-400 text-sm">
          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin mt-0.5" />
          Procesando acción...
        </div>
      )}

      <TeamTable
        members={filteredTeam}
        loading={loading}
        onEdit={handleEdit}
        onSuspend={handleSuspend}
        onReactivate={handleReactivate}
        columns={['name', 'role', 'status', 'actions']}
      />

      {/* Modal de edición */}
      <TeamMemberModal
        member={selectedMember}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedMember(null);
        }}
        onSave={handleSaveChanges}
        practiceAreas={practiceAreas}
      />
    </div>
  );
}

export default FirmTeam;
