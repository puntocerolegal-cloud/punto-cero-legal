import React from 'react';
import { Edit2, Ban, RotateCcw, AlertCircle } from 'lucide-react';

export function TeamTable({
  members,
  loading,
  onEdit,
  onSuspend,
  onReactivate,
  columns = ['name', 'role', 'specialty', 'status', 'actions']
}) {
  if (loading) {
    return <div className="text-center py-8 text-gray-400">Cargando equipo...</div>;
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-gray-400">No hay miembros en el equipo</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACTIVE': { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Activo' },
      'active': { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Activo' },
      'suspended': { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Suspendido' },
      'SUSPENDED': { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Suspendido' },
      'inactive': { bg: 'bg-gray-900/30', text: 'text-gray-400', label: 'Inactivo' },
      'PENDING_ACTIVATION': { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Pendiente' },
    };
    const config = statusMap[status] || { bg: 'bg-gray-900/30', text: 'text-gray-400', label: status };
    return <span className={`px-2 py-1 rounded text-xs ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      'firm_owner': { bg: 'bg-purple-900/30', text: 'text-purple-400' },
      'partner': { bg: 'bg-blue-900/30', text: 'text-blue-400' },
      'senior_lawyer': { bg: 'bg-indigo-900/30', text: 'text-indigo-400' },
      'lawyer': { bg: 'bg-cyan-900/30', text: 'text-cyan-400' },
      'paralegal': { bg: 'bg-green-900/30', text: 'text-green-400' },
      'assistant': { bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
      'finance': { bg: 'bg-amber-900/30', text: 'text-amber-400' },
      'hr': { bg: 'bg-pink-900/30', text: 'text-pink-400' },
    };
    const config = roleMap[role] || { bg: 'bg-gray-900/30', text: 'text-gray-400' };
    return <span className={`px-2 py-1 rounded text-xs ${config.bg} ${config.text}`}>{role.replace('_', ' ').toUpperCase()}</span>;
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900 border-b border-gray-700">
          <tr>
            {columns.includes('name') && <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>}
            {columns.includes('role') && <th className="px-6 py-4 text-left text-sm font-semibold">Rol</th>}
            {columns.includes('specialty') && <th className="px-6 py-4 text-left text-sm font-semibold">Especialidad</th>}
            {columns.includes('area') && <th className="px-6 py-4 text-left text-sm font-semibold">Área</th>}
            {columns.includes('supervisor') && <th className="px-6 py-4 text-left text-sm font-semibold">Supervisor</th>}
            {columns.includes('cases') && <th className="px-6 py-4 text-left text-sm font-semibold">Casos</th>}
            {columns.includes('status') && <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>}
            {columns.includes('actions') && <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
              {columns.includes('name') && (
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold">{member.name || member.full_name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </td>
              )}
              {columns.includes('role') && (
                <td className="px-6 py-4">
                  {getRoleBadge(member.role)}
                </td>
              )}
              {columns.includes('specialty') && (
                <td className="px-6 py-4 text-gray-400">
                  {member.specialty || member.active_cases !== undefined ? `${member.active_cases} casos activos` : '—'}
                </td>
              )}
              {columns.includes('area') && (
                <td className="px-6 py-4 text-gray-400">
                  {member.practice_area || '—'}
                </td>
              )}
              {columns.includes('supervisor') && (
                <td className="px-6 py-4 text-gray-400">
                  {member.supervisor_name || '—'}
                </td>
              )}
              {columns.includes('cases') && (
                <td className="px-6 py-4">
                  {member.active_cases || 0}
                </td>
              )}
              {columns.includes('status') && (
                <td className="px-6 py-4">
                  {getStatusBadge(member.status)}
                </td>
              )}
              {columns.includes('actions') && (
                <td className="px-6 py-4 flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(member)}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-blue-400" />
                    </button>
                  )}
                  {onSuspend && member.status !== 'suspended' && member.status !== 'SUSPENDED' && (
                    <button
                      onClick={() => onSuspend(member)}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                      title="Suspender"
                    >
                      <Ban className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                  {onReactivate && (member.status === 'suspended' || member.status === 'SUSPENDED') && (
                    <button
                      onClick={() => onReactivate(member)}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                      title="Reactivar"
                    >
                      <RotateCcw className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
