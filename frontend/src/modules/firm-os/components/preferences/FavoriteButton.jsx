import React from 'react';
import { Star } from 'lucide-react';

export function FavoriteButton({ isFavorite, onToggle, moduleName, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const containerClass = size === 'sm' ? 'p-1' : size === 'lg' ? 'p-2' : 'p-1.5';

  return (
    <button
      onClick={() => onToggle(moduleName)}
      className={`${containerClass} rounded-lg transition-all hover:bg-white/10`}
      title={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
    >
      <Star
        className={`${sizeClass} transition-all ${
          isFavorite
            ? 'fill-amber-400 text-amber-400'
            : 'text-white/40 hover:text-white/60'
        }`}
      />
    </button>
  );
}
