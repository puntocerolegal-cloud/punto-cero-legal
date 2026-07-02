import React from 'react';
import { Inbox, Users, FolderKanban, PlusCircle, Search } from 'lucide-react';

const EMPTY_STATES = {
  lawyers: {
    icon: Users,
    title: 'Sin abogados todavía',
    description: 'Tu equipo es el corazón de tu firma. Invita a tu primer abogado para comenzar.',
    cta: 'Invitar abogado',
    color: 'blue',
  },
  cases: {
    icon: FolderKanban,
    title: 'Sin casos en progreso',
    description: 'Crea tu primer caso para empezar a gestionar tu práctica legal.',
    cta: 'Crear caso',
    color: 'purple',
  },
  clients: {
    icon: Users,
    title: 'Sin clientes registrados',
    description: 'Los clientes son la base de tu negocio. Registra tu primer cliente.',
    cta: 'Agregar cliente',
    color: 'emerald',
  },
  search: {
    icon: Search,
    title: 'Sin resultados',
    description: 'No encontramos coincidencias. Intenta con otra búsqueda o ajusta los filtros.',
    cta: 'Limpiar búsqueda',
    color: 'amber',
  },
  default: {
    icon: Inbox,
    title: 'Sin datos disponibles',
    description: 'No hay información para mostrar en este momento.',
    cta: null,
    color: 'gray',
  },
};

export function EmptyStatePremium({ type = 'default', onAction, actionText = null }) {
  const state = EMPTY_STATES[type] || EMPTY_STATES.default;
  const Icon = state.icon;

  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    gray: 'text-white/60',
  };

  const bgClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
    emerald: 'bg-emerald-500/10 border-emerald-500/30',
    amber: 'bg-amber-500/10 border-amber-500/30',
    gray: 'bg-white/5 border-white/10',
  };

  return (
    <div className={`rounded-xl border p-12 text-center ${bgClasses[state.color]}`}>
      <Icon className={`w-16 h-16 mx-auto mb-4 ${colorClasses[state.color]}`} />
      <h3 className="text-lg font-semibold text-white mb-2">{state.title}</h3>
      <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">{state.description}</p>
      {(state.cta || actionText) && onAction && (
        <button
          onClick={onAction}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            state.color === 'blue'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : state.color === 'purple'
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : state.color === 'emerald'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : state.color === 'amber'
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          {actionText || state.cta}
        </button>
      )}
    </div>
  );
}
