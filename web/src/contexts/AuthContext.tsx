"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  studentProfile?: {
    enrollmentStatus?: 'ACTIVE' | 'SUSPENDED' | 'GRADUATED';
    [key: string]: unknown;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ token: string; user: User }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUser();
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await authApi.getMe();
      if (userData) {
        setUser(userData);
      }
    } catch (error: any) {
      // Token invalide, expiré, ou serveur non disponible - nettoyer complètement
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      
      // Si c'est une erreur de connexion, ne pas afficher d'erreur toast
      // car cela peut être normal si le serveur n'est pas démarré
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        // Seulement afficher pour les autres erreurs
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        toast.success('Connexion réussie');
        return response;
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error: any) {
      let errorMessage = 'Erreur de connexion';
      
      if (error.response) {
        // Erreur avec réponse du serveur
        errorMessage = error.response.data?.error || error.message || 'Erreur de connexion';
        
        // Messages plus explicites selon le code d'erreur
        if (error.response.status === 401) {
          if (errorMessage.includes('désactivé')) {
            errorMessage = 'Votre compte a été désactivé. Contactez l\'administrateur.';
          } else {
            errorMessage = 'Email ou mot de passe incorrect. Vérifiez vos identifiants.';
          }
        } else if (error.response.status === 403) {
          if (error.response.data?.code === 'ENROLLMENT_SUSPENDED') {
            errorMessage =
              error.response.data?.error ||
              'Votre inscription est suspendue. Contactez l’administration.';
          } else {
            errorMessage = error.response.data?.error || 'Accès refusé.';
          }
        } else if (error.response.status === 400) {
          errorMessage = 'Veuillez vérifier que tous les champs sont correctement remplis.';
        } else if (error.response.status >= 500) {
          const serverMsg =
            typeof error.response.data?.error === 'string'
              ? error.response.data.error
              : null;
          errorMessage =
            serverMsg ||
            'Erreur serveur. Vérifiez la console du backend et la connexion à la base de données.';
        }
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      }
      
      toast.error(errorMessage);
      console.error('Erreur de connexion:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    toast.success('Déconnexion réussie');
    // Rediriger vers la page d'accueil
    window.location.href = '/home';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

