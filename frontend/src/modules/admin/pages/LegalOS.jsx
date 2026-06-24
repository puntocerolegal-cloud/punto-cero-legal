import React, { useEffect, useState } from "react";
import { Cpu, Zap, Activity, Brain, Shield, Lock } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";

export function LegalOS() {
  const [osStatus, setOsStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOSStatus();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadOSStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadOSStatus = async () => {
    try {
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${API}/legal-os/status`, { headers });
      setOsStatus(res.data?.data || {});
    } catch (err) {
      console.error("Error loading OS status:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#f97316]/20 border-t-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-white/60">Iniciando Sistema Operativo...</p>
        </div>
      </div>
    );
  }

  const components = osStatus?.system_components || {};
  const health = osStatus?.system_health || {};

  return (
    <div className="space-y-8">
      {/* OS Status Header */}
      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Cpu className="w-12 h-12 text-green-400 animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold text-white">LEGAL OPERATING SYSTEM</h1>
              <p className="text-green-400 text-sm font-semibold">FINAL FORM — FULLY AUTONOMOUS</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-4 py-2 bg-green-500 text-black font-bold rounded-lg animate-pulse">
              OPERATING_SYSTEM_ACTIVE
            </div>
            <p className="text-white/60 text-xs mt-2">
              Mode: {osStatus?.mode || "UNKNOWN"}
            </p>
          </div>
        </div>
      </div>

      {/* System Components Status */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">System Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(components).map(([name, status]) => (
            <div
              key={name}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <p className="text-white/70 text-sm capitalize">{name.replace(/_/g, " ")}</p>
              </div>
              <p className="text-green-400 font-semibold text-sm">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Health Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-white/60 text-sm">Total Leads</p>
            <p className="text-3xl font-bold text-[#f97316]">{health.leads || 0}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-white/60 text-sm">Total Cases</p>
            <p className="text-3xl font-bold text-blue-400">{health.cases || 0}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-white/60 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-green-400">{health.users || 0}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-white/60 text-sm">Total Orgs</p>
            <p className="text-3xl font-bold text-purple-400">{health.organizations || 0}</p>
          </div>
        </div>
      </div>

      {/* Core Capabilities */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Autonomous Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-semibold">Global Legal Brain</h3>
            </div>
            <p className="text-white/60 text-sm">
              Accumulated intelligence from all cases, leads, and operations. Powers autonomous decisions.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h3 className="text-white font-semibold">Economic Engine</h3>
            </div>
            <p className="text-white/60 text-sm">
              Predicts revenue, optimizes commissions, maximizes conversion. Financial autonomy.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-green-400" />
              <h3 className="text-white font-semibold">Event-Driven Core</h3>
            </div>
            <p className="text-white/60 text-sm">
              Every event triggers automatic cascades of actions. No manual intervention needed.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-red-400" />
              <h3 className="text-white font-semibold">Self-Healing Core</h3>
            </div>
            <p className="text-white/60 text-sm">
              Detects and fixes issues automatically. Zero manual error correction needed.
            </p>
          </div>
        </div>
      </div>

      {/* Operating Principles */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" /> Operating Principles
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
            <div>
              <p className="text-white font-semibold text-sm">Autonomous Operations</p>
              <p className="text-white/60 text-xs">System operates without manual intervention in commercial flows</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
            <div>
              <p className="text-white font-semibold text-sm">Self-Optimization</p>
              <p className="text-white/60 text-xs">Continuously improves itself through data analysis and feedback loops</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
            <div>
              <p className="text-white font-semibold text-sm">Resource Intelligence</p>
              <p className="text-white/60 text-xs">Automatically allocates lawyers, agents, and cases to maximize efficiency</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
            <div>
              <p className="text-white font-semibold text-sm">Global Scale</p>
              <p className="text-white/60 text-xs">Operates across multiple countries, currencies, and legal jurisdictions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
            <div>
              <p className="text-white font-semibold text-sm">Zero Human Overhead</p>
              <p className="text-white/60 text-xs">Humans only needed for strategic decisions, not operational execution</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
        <p className="text-green-400 font-semibold">
          ✓ Legal Operating System Running at Full Capacity
        </p>
        <p className="text-white/60 text-xs mt-2">
          Punto Cero System OS v15.0 - Fully Autonomous Legal & Commercial OS
        </p>
      </div>
    </div>
  );
}

export default LegalOS;
