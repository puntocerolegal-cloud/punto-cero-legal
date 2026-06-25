import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, FileText, FileSymlink, MessageSquare, Send } from 'lucide-react';

export default function AICorporate({ firmId }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const tabs = [
    { id: 'summary', label: 'Resumen Expedientes', icon: FileText },
    { id: 'contracts', label: 'Redacción Contratos', icon: FileSymlink },
    { id: 'documents', label: 'Generador Documentos', icon: FileText },
    { id: 'assistant', label: 'Asistente Jurídico', icon: MessageSquare }
  ];

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, {
        type: 'user',
        text: inputValue
      }]);
      setInputValue('');

      // Simular respuesta IA
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'ai',
          text: 'Esta funcionalidad estará disponible próximamente. Estamos entrenando el asistente jurídico especializado.'
        }]);
      }, 500);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-[#8b5cf6]" />
          <h2 className="text-3xl font-bold text-white">IA Corporativa</h2>
        </div>
        <p className="text-white/60">Asistente jurídico potenciado con inteligencia artificial</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-b border-white/10"
      >
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-all font-semibold whitespace-nowrap ${
                  isActive
                    ? 'border-b-[#8b5cf6] text-[#8b5cf6]'
                    : 'border-b-transparent text-white/60 hover:text-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8"
      >
        {activeTab === 'assistant' ? (
          <div className="space-y-4 h-96 flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-white/60 py-12">
                  <p>Hola, soy tu asistente jurídico corporativo.</p>
                  <p className="text-sm mt-2">¿En qué puedo ayudarte?</p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-[#3b82f6] text-white'
                        : 'bg-white/[0.03] text-white/80 border border-white/10'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2.5 rounded-lg bg-[#8b5cf6] text-white hover:bg-[#7c3aed] transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-white/60">
            <p>Módulo {tabs.find(t => t.id === activeTab)?.label} en desarrollo</p>
            <p className="text-sm mt-2">Las funcionalidades estarán disponibles próximamente</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
