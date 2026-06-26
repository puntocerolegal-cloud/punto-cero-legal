import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/config/api';

const AuthContext = createContext(null);
const STORAGE_PASSPHRASE = process.env.REACT_APP_STORAGE_KEY || null;
const TOKEN_KEY = 'pcl_token';
const USER_KEY = 'pcl_user';

// Modo Demo/Local (solo desarrollo): cuando el backend (puerto 8000) no está
// disponible y NO hay sesión almacenada, se inyecta un admin simulado para
// validar toda la UI sin pasar por el login. En build de producción
// (NODE_ENV==='production') este bloque se elimina por tree-shaking → cero impacto.
const DEV_MODE = process.env.NODE_ENV === 'development';
const DEV_MOCK_USER = {
  id: 'dev-admin-principal',
  full_name: 'Admin Principal (Demo)',
  email: 'demo@puntocero.local',
  role: 'admin_general',     // ADMIN_ROLES → acceso completo al System OS
  is_verified: true,
  status: 'ACTIVE',
  country: 'Colombia',
};

async function _getCryptoKey() {
  if (!STORAGE_PASSPHRASE || !window?.crypto?.subtle) return null;
  const enc = new TextEncoder();
  const hash = await window.crypto.subtle.digest('SHA-256', enc.encode(STORAGE_PASSPHRASE));
  return window.crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptString(plain) {
  const key = await _getCryptoKey();
  if (!key) return plain;
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decryptString(b64) {
  const key = await _getCryptoKey();
  if (!key) return b64;
  try {
    const data = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const cipher = data.slice(12);
    const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch (e) {
    console.error('Decrypt failed:', e);
    return null;
  }
}

async function setStoredToken(token) {
  if (!token) return removeStoredToken();
  try {
    const payload = STORAGE_PASSPHRASE ? await encryptString(token) : token;
    localStorage.setItem(TOKEN_KEY, payload);
    syncStorageKeys(token, JSON.parse(localStorage.getItem('pcl_user') || 'null'));
  } catch (e) {
    console.error('Failed to store token securely:', e);
    localStorage.setItem(TOKEN_KEY, token);
    syncStorageKeys(token, JSON.parse(localStorage.getItem('pcl_user') || 'null'));
  }
}

async function getStoredToken() {
  const v = localStorage.getItem(TOKEN_KEY);
  if (!v) return null;
  if (!STORAGE_PASSPHRASE) return v;
  return await decryptString(v);
}

function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function setStoredUser(user) {
  try {
    const str = JSON.stringify(user);
    const payload = STORAGE_PASSPHRASE ? await encryptString(str) : str;
    localStorage.setItem(USER_KEY, payload);
    const tokenStr = localStorage.getItem('pcl_token') || localStorage.getItem(TOKEN_KEY);
    syncStorageKeys(tokenStr, user);
  } catch (e) {
    console.error('Failed to store user securely:', e);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    const tokenStr = localStorage.getItem('pcl_token') || localStorage.getItem(TOKEN_KEY);
    syncStorageKeys(tokenStr, user);
  }
}

async function getStoredUser() {
  const v = localStorage.getItem(USER_KEY);
  if (!v) return null;
  if (!STORAGE_PASSPHRASE) return JSON.parse(v);
  const dec = await decryptString(v);
  return dec ? JSON.parse(dec) : null;
}

function removeStoredUser() {
  localStorage.removeItem(USER_KEY);
}

// Sincronizar con claves antiguas para compatibilidad (Firm OS y otros módulos usan diferentes claves)
function syncStorageKeys(token, user) {
  if (token) {
    localStorage.setItem('pcl_token', token);
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('pcl_token');
    localStorage.removeItem('token');
  }
  if (user) {
    localStorage.setItem('pcl_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('pcl_user');
    localStorage.removeItem('user');
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await getStoredToken();
        const u = await getStoredUser();
        if (!mounted) return;
        if (t) {
          setToken(t);
          axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        }
        if (u) {
          console.log("█ AUTH DEBUG - Stored User Loaded:", u);
          console.log("█ AUTH DEBUG - Stored user.role:", u?.role);
          setUser(u);
        } else if (DEV_MODE && !t) {
          // Sin sesión real en desarrollo → acceso directo con admin simulado
          // (no se hace fetch a /api/auth/login; el login real sigue intacto).
          console.log("█ AUTH DEBUG - DEV MODE: Using mock user", DEV_MOCK_USER);
          console.log("█ AUTH DEBUG - Mock user.role:", DEV_MOCK_USER.role);
          setUser(DEV_MOCK_USER);
        }
      } catch (e) {
        console.error('Auth init failed:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    console.log("█ AUTH DEBUG - Login Response:", response.data);
    console.log("█ AUTH DEBUG - User Data:", userData);
    console.log("█ AUTH DEBUG - user.role from /auth/login:", userData?.role);
    await setStoredToken(access_token);
    await setStoredUser(userData);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    const { access_token, user: newUser } = response.data;
    await setStoredToken(access_token);
    await setStoredUser(newUser);
    setToken(access_token);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    removeStoredToken();
    removeStoredUser();
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`);
      const fresh = res.data;
      console.log("█ AUTH DEBUG - /auth/me Response:", res.data);
      console.log("█ AUTH DEBUG - Refreshed user.role:", fresh?.role);
      await setStoredUser(fresh);
      setUser(fresh);
      return fresh;
    } catch (e) {
      console.error('refreshUser failed:', e);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
