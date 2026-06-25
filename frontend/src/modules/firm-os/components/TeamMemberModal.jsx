import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API } from '@/config/api';

export function TeamMemberModal({ member, isOpen, onClose, onSave, practiceAreas = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    role: 'lawyer',
    practice_area: '',
    supervisor_id: '',
  });
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (member) {
      setFormData({
        role: member.role || 'lawyer',
        practice_area: member.practice_area || '',
        supervisor_id: member.supervisor_id || '',
      });
    }
  }, [member]);

  useEffect(() => {
    if (isOpen) {
      loadTeamMembers();
    }
  }, [isOpen]);

  const loadTeamMembers = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const firmId = user.firm_id;
      
      if (!firmId) return;

      const res = await axios.get(`${API}/rbac/team/${firmId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setTeamMembers(res.data.team || []);
    } catch (err) {
      console.error('Error loading team members:', err);
    }
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const firmId = user.firm_id;

      // Asignar rol
      if (formData.role !== member.role) {
        await axios.post(
          `${API}/rbac/users/${member.id}/assign-role`,
          { role: formData.role },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
      }

      // Asignar área de práctica
      if (formData.practice_area && formData.practice_area !== member.practice_area) {
        await axios.patch(
          `${API}/firms/${firmId}/team/${member.id}`,
          { practice_area: formData.practice_area },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
      }

      // Asignar supervisor
      if (formData.supervisor_id && formData.supervisor_id !== member.supervisor_id) {
        await axios.patch(
          `${API}/firms/${firmId}/team/${member.id}`,
          { supervisor_id: formData.supervisor_id },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
      }

      onSave({ ...member, ...formData });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar cambios');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  const supervisors = teamMembers.filter(m => 
    m.role === 'partner' || m.role === 'senior_lawyer' || m.role === 'firm_owner'
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Editar Miembro</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 flex gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-gray-300 mb-2">Nombre</p>
            <p className="text-white">{member.name || member.full_name}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Rol *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="firm_owner">Firm Owner</option>
              <option value="partner">Partner</option>
              <option value="senior_lawyer">Senior Lawyer</option>
              <option value="lawyer">Lawyer</option>
              <option value="paralegal">Paralegal</option>
              <option value="assistant">Assistant</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
            </select>
          </div>

          {practiceAreas.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Área de Práctica
              </label>
              <select
                value={formData.practice_area}
                onChange={(e) => setFormData(prev => ({ ...prev, practice_area: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Seleccionar área...</option>
                {practiceAreas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {supervisors.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Supervisor
              </label>
              <select
                value={formData.supervisor_id}
                onChange={(e) => setFormData(prev => ({ ...prev, supervisor_id: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Sin supervisor</option>
                {supervisors.map(supervisor => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name} ({supervisor.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 Cambios se guardarán en los registros de auditoría de la firma.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
