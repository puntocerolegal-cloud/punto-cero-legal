import React, { useState } from "react";
import { MessageCircle, FolderKanban, Users, Plus, Send, Search, BookOpen, Building2, FileText } from "lucide-react";

const ConversationCard = ({ title, context, lastMessage, participants, timestamp, icon: Icon, isActive, onSelect }) => (
  <div
    onClick={onSelect}
    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
      isActive
        ? 'border-white/40 bg-white/10'
        : 'border-white/10 bg-white/5 hover:border-white/20'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-5 w-5 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{title}</p>
        <p className="text-xs text-white/60 mt-1">{context}</p>
        <p className="text-xs text-white/50 mt-1 truncate">{lastMessage}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-white/40">{participants} participantes</p>
          <p className="text-xs text-white/40">{timestamp}</p>
        </div>
      </div>
    </div>
  </div>
);

export function CommunicationPage() {
  const [activeConversation, setActiveConversation] = useState('case-001');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const conversationGroups = {
    cases: {
      label: 'Por Caso',
      icon: FolderKanban,
      color: 'text-cyan-400',
      conversations: [
        { id: 'case-001', title: 'Caso #CAS-001', context: 'Por caso', lastMessage: 'La documentación está lista...', participants: 3, timestamp: 'hace 15m' },
        { id: 'case-002', title: 'Caso #CAS-002', context: 'Por caso', lastMessage: 'Se requiere revisión urgente', participants: 2, timestamp: 'hace 1h' },
      ]
    },
    clients: {
      label: 'Por Cliente',
      icon: Users,
      color: 'text-purple-400',
      conversations: [
        { id: 'client-001', title: 'Empresa XYZ SAS', context: 'Por cliente', lastMessage: 'Consultando sobre el estado', participants: 2, timestamp: 'hace 30m' },
        { id: 'client-002', title: 'Persona Natural ABC', context: 'Por cliente', lastMessage: 'Dudas sobre facturación', participants: 1, timestamp: 'hace 2h' },
      ]
    },
    lawyers: {
      label: 'Por Abogado',
      icon: BookOpen,
      color: 'text-amber-400',
      conversations: [
        { id: 'lawyer-001', title: 'Carlos Rodríguez', context: 'Por abogado', lastMessage: 'Disponible para nueva asignación', participants: 2, timestamp: 'hace 10m' },
        { id: 'lawyer-002', title: 'María López', context: 'Por abogado', lastMessage: 'Necesita consultoría en civil', participants: 2, timestamp: 'hace 1h' },
      ]
    },
    departments: {
      label: 'Por Departamento',
      icon: Building2,
      color: 'text-emerald-400',
      conversations: [
        { id: 'dept-001', title: 'Departamento Civil', context: 'Por departamento', lastMessage: 'Coordinación de actividades', participants: 4, timestamp: 'hace 5m' },
        { id: 'dept-002', title: 'Departamento Laboral', context: 'Por departamento', lastMessage: 'Sincronización de demandas', participants: 3, timestamp: 'hace 45m' },
      ]
    },
    announcements: {
      label: 'Anuncios Generales',
      icon: MessageCircle,
      color: 'text-red-400',
      conversations: [
        { id: 'announce-001', title: 'Anuncios de Firma', context: 'Anuncios', lastMessage: 'Nueva política de horarios implementada', participants: 15, timestamp: 'hace 2h' },
      ]
    }
  };

  const allConversations = Object.values(conversationGroups).flatMap(g => g.conversations);
  const currentConversation = allConversations.find(c => c.id === activeConversation);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Centro de Comunicación Empresarial</h1>
        <p className="text-white/60 mt-2">Conversaciones organizadas por contexto: casos, clientes, abogados, departamentos y anuncios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Conversaciones */}
        <div className="lg:col-span-1 rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Conversaciones</h2>
            <button className="rounded-lg p-2 hover:bg-white/10">
              <Plus className="h-4 w-4 text-white/60" />
            </button>
          </div>

          {/* Búsqueda */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Conversaciones por grupo */}
          <div className="space-y-6 max-h-[600px] overflow-y-auto">
            {Object.entries(conversationGroups).map(([key, group]) => (
              <div key={key}>
                <h3 className="text-xs uppercase tracking-wider text-white/50 mb-2 flex items-center gap-2">
                  <group.icon className={`h-4 w-4 ${group.color}`} />
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.conversations.map(conv => (
                    <ConversationCard
                      key={conv.id}
                      {...conv}
                      icon={group.icon}
                      isActive={activeConversation === conv.id}
                      onSelect={() => setActiveConversation(conv.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho: Contenido de conversación */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col h-[600px]">
          {currentConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{currentConversation.title}</h2>
                  <p className="text-xs text-white/50">{currentConversation.participants} participante{currentConversation.participants !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg p-2 hover:bg-white/10">
                    <Search className="h-5 w-5 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Información de la conversación */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 font-semibold">Conversación: {currentConversation.title}</p>
                  <p className="text-white/40 text-sm mt-2">{currentConversation.context}</p>
                  <p className="text-white/30 text-xs mt-4">Última actualización: {currentConversation.timestamp}</p>

                  <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-white/50 uppercase mb-2">Participantes</p>
                    <p className="text-white font-semibold">{currentConversation.participants} personas en esta conversación</p>
                  </div>

                  <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs text-blue-300">💡 Esta es una arquitectura visual preparada para integración futura con WebSockets</p>
                  </div>
                </div>
              </div>

              {/* Input de mensaje */}
              <div className="border-t border-white/10 px-6 py-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <button className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors" disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Selecciona una conversación</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommunicationPage;
