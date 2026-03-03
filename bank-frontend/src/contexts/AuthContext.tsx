import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  passwordChangeRequired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState<boolean>(false);

  useEffect(() => {
    // Load auth data from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedPcr = localStorage.getItem('passwordChangeRequired');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    if (storedPcr === 'true') {
      setPasswordChangeRequired(true);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const needsPasswordChange = !!data.passwordChangeRequired;
      
      const userData: User = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        roles: data.roles,
      };

      setToken(data.accessToken);
      setUser(userData);
      setPasswordChangeRequired(needsPasswordChange);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('passwordChangeRequired', needsPasswordChange ? 'true' : 'false');
      
      toast.success(`Welcome back, ${data.fullName}!`);
      return needsPasswordChange;
    } catch (error) {
      toast.error('Invalid username or password');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPasswordChangeRequired(false);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('passwordChangeRequired');
    toast.info('Logged out successfully');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error('Not authenticated');
    const response = await fetch('http://localhost:8080/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const message = response.status === 401 ? 'Session expired. Please login again.' : 'Unable to change password';
      toast.error(message);
      if (response.status === 401) logout();
      throw new Error(message);
    }

    setPasswordChangeRequired(false);
    localStorage.setItem('passwordChangeRequired', 'false');
    toast.success('Password updated successfully');
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const hasAnyRole = (...roles: string[]): boolean => {
    if (!user) return false;
    return roles.some(role => user.roles.includes(role));
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user && !!token,
    hasRole,
    hasAnyRole,
    passwordChangeRequired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
