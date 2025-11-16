import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User, UserCreate, LoginRequest, UserUpdate } from '../types/auth';
import AuthService from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  updateUser: (userData: UserUpdate) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          await refreshUser();
        } catch {
          AuthService.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest) => {
    try {
      await AuthService.login(credentials);
      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData: UserCreate) => {
    try {
      await AuthService.signup(userData);
      // Auto login after signup
      await login({ username: userData.username, password: userData.password });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.clearTokens();
    setUser(null);
  };

  const updateUser = async (userData: UserUpdate) => {
    try {
      const updatedUser = await AuthService.updateUser(userData);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;