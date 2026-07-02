import React, { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const NodePalette = ({
  palette,
  paletteByCategory,
  onNodeDragStart,
}) => {
  const [expandedCategory, setExpandedCategory] = useState('Inicio');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPalette = useMemo(() => {
    if (!searchQuery) return paletteByCategory;

    const filtered = {};
    Object.entries(paletteByCategory).forEach(([category, nodes]) => {
      const categoryNodes = nodes.filter(n =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (categoryNodes.length > 0) {
        filtered[category] = categoryNodes;
      }
    });
    return filtered;
  }, [paletteByCategory, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Nodos</h3>

        <div className="relative">
          <Search size={16} className="absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar nodos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(filteredPalette).map(([category, nodes]) => (
          <div key={category}>
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 flex items-center justify-between transition-colors"
            >
              {category}
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedCategory === category ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedCategory === category && (
              <div className="p-2 space-y-2">
                {nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onNodeDragStart(e, node.type)}
                    className="p-2 bg-white border border-gray-200 rounded cursor-move hover:shadow-md hover:border-blue-300 transition-all"
                    style={{ borderLeftColor: node.color, borderLeftWidth: '3px' }}
                  >
                    <p className="text-xs font-medium text-gray-900">{node.label}</p>
                    <p className="text-xs text-gray-500">{node.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(NodePalette);
