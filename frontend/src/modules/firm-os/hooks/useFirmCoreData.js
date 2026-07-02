import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

export function useFirmCoreData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState({
    lawyers: [],
    cases: [],
    clients: [],
  });

  const firmId = user?.firm_id;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!firmId) {
        setError("No tienes acceso a una firma");
        setLoading(false);
        return;
      }

      const [lawyersRes, casesRes, clientsRes] = await Promise.all([
        axios.get(`${API}/firms/${firmId}/lawyers`),
        axios.get(`${API}/firms/${firmId}/cases`),
        axios.get(`${API}/firms/${firmId}/clients`),
      ]);

      setRawData({
        lawyers: lawyersRes.data.data || [],
        cases: casesRes.data.data || [],
        clients: clientsRes.data.data || [],
      });
    } catch (err) {
      console.error("Error loading firm core data:", err);
      setError("Error al cargar datos de la firma");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoize the data to prevent unnecessary re-renders
  const data = useMemo(() => ({
    lawyers: rawData.lawyers,
    cases: rawData.cases,
    clients: rawData.clients,
  }), [rawData.lawyers, rawData.cases, rawData.clients]);

  return {
    loading,
    error,
    lawyers: data.lawyers,
    cases: data.cases,
    clients: data.clients,
    refresh: loadData,
  };
}
