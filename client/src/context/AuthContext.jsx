import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { generateKeyPair, exportKey, importKey } from '../utils/e2ee';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to ensure keys exist and sync public key
  const setupKeys = async (token) => {
      let privateKeyJwk = localStorage.getItem('privateKey');
      let publicKeyJwk = localStorage.getItem('publicKey');

      if (!privateKeyJwk || !publicKeyJwk) {
          const keyPair = await generateKeyPair();
          const exportedPrivate = await exportKey(keyPair.privateKey);
          const exportedPublic = await exportKey(keyPair.publicKey);

          privateKeyJwk = JSON.stringify(exportedPrivate);
          publicKeyJwk = JSON.stringify(exportedPublic);

          localStorage.setItem('privateKey', privateKeyJwk);
          localStorage.setItem('publicKey', publicKeyJwk);
      }

      // Always try to sync public key to server if logged in
      try {
           await api.put('/users/key', { publicKey: publicKeyJwk });
      } catch (error) {
           console.error("Failed to sync public key", error);
      }
  };

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
          // Setup keys in background
          setupKeys(token); 
        } catch (error) {
          console.error("Auth check failed", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data);
    await setupKeys(data.token);
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', data.token);
    setUser(data);
    await setupKeys(data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Optional: Clear keys? Usually keep them to persist identity on device
    // localStorage.removeItem('privateKey'); 
    // localStorage.removeItem('publicKey');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
