import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Loader2, AlertCircle, MapPin, Users, Badge, ExternalLink } from 'lucide-react';
import { API } from '@/config/api';
import { Link } from 'react-router-dom';

export default function FirmsDirectory() {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  useEffect(() => {
    loadFirms();
  }, []);

  const loadFirms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API}/public/firms`);
      setFirms(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar directorio de firmas');
    } finally {
      setLoading(false);
    }
  };

  const filteredFirms = firms.filter(firm => {
    if (filterCity && firm.city !== filterCity) return false;
    if (filterPlan && firm.plan !== filterPlan) return false;
    return true;
  });

  const cities = [...new Set(firms.map(f => f.city))].sort();
  const plans = [...new Set(firms.map(f => f.plan))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]">
      {/* Header */}
      <div className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.10),transparent_50%)]" />
        
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
              Directorio de <span className="bg-gradient-to-r from-[#3b82f6] to-[#f97316] bg-clip-text text-transparent">Firmas Jurídicas</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Encuentra y conecta con firmas jurídicas especializadas en toda la región LATAM
            </p>
          </motion.div>

          {/* Filters */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm text-white/70 mb-2">Filtrar por Ciudad</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">Todas las ciudades</option>
                {cities.map(city => (
                  <option key={city} value={city} className="bg-[#0f172a]">{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-2">Filtrar por Plan</label>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">Todos los planes</option>
                {plans.map(plan => (
                  <option key={plan} value={plan} className="bg-[#0f172a]">
                    {plan === 'firm_growth' ? 'Firma en Crecimiento' : 'Consolidación Empresarial'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 rounded-lg bg-red-900/30 border border-red-700/50 flex gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredFirms.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg">No se encontraron firmas con los filtros seleccionados</p>
          </div>
        )}

        {/* Firms Grid */}
        {!loading && filteredFirms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {filteredFirms.map((firm, idx) => (
              <motion.div
                key={firm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all group"
              >
                {/* Logo */}
                {firm.logo && (
                  <div className="h-20 w-20 rounded-lg bg-white/10 flex items-center justify-center mb-4 overflow-hidden">
                    <img src={firm.logo} alt={firm.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Name */}
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{firm.name}</h3>

                {/* Plan Badge */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#3b82f6] text-xs font-semibold">
                    <Badge className="w-3 h-3" />
                    {firm.plan === 'firm_growth' ? 'Crecimiento' : 'Consolidación'}
                  </span>
                </div>

                {/* City */}
                <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{firm.city}, {firm.country}</span>
                </div>

                {/* Lawyers Count */}
                <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>{firm.active_lawyers_count || 0} abogados</span>
                </div>

                {/* Description */}
                {firm.description && (
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {firm.description}
                  </p>
                )}

                {/* View Profile Button */}
                <Link
                  to={`/firms/${firm.slug}`}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#f97316] text-white text-sm font-semibold hover:shadow-lg transition-all group/btn"
                >
                  Ver Perfil
                  <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="text-center text-white/60 text-sm">
            Mostrando {filteredFirms.length} de {firms.length} firmas
          </div>
        )}
      </div>
    </div>
  );
}
