import React, { createContext, useContext, useEffect, useState } from 'react';
import { Admin } from '../types';
import { hasAdminAccount, loginAdmin } from '../services/authService';

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  hasAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkStatus: () => Promise<void>;
  setAdminDirectly: (admin: Admin) => void;
}

const AuthContext = createContext<AuthContextType>({
  admin: null,
  isLoading: true,
  hasAdmin: false,
  login: async () => false,
  logout: () => {},
  checkStatus: async () => {},
  setAdminDirectly: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);

  const checkStatus = async () => {
    try {
      const exists = await hasAdminAccount();
      setHasAdmin(exists);
    } catch (e) {
      console.error('Error checking admin status', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const user = await loginAdmin(username, password);
      if (user) {
        setAdmin(user);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error', e);
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
  };

  const setAdminDirectly = (newAdmin: Admin) => {
    setAdmin(newAdmin);
    setHasAdmin(true);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        hasAdmin,
        login,
        logout,
        checkStatus,
        setAdminDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
