import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '../api';
import { User, LoginResponseData } from '../types';



interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, email?: string) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初始化检查登录状态
  useEffect(() => {
    checkAuth();
  }, []);

  // 检查登录状态
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      const userJson = localStorage.getItem('user');

      if (!accessToken || !userJson) {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      // 验证用户信息
      const parsedUser: User = JSON.parse(userJson);
      setUser(parsedUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      // 只在访问令牌无效时清除localStorage，避免刷新时误清除
      if (error instanceof Error && error.message.includes('401')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({
        username,
        password,
      });

      if (response.data.code === 0 && response.data.data) {
        const loginData: LoginResponseData = response.data.data;
        
        // 存储登录信息
        localStorage.setItem('access_token', loginData.access_token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        
        setUser(loginData.user);
        setIsAuthenticated(true);
        return true;
      } else {
        // 处理后端返回的错误
        return false;
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      // 如果是401错误，说明用户名或密码错误，返回false让调用者显示错误提示
      //返回false
      return false;
    }
  };

  // 注册
  const register = async (username: string, password: string, email?: string): Promise<boolean> => {
    try {
      const response = await authApi.register({
        username,
        password,
        email,
      });

      return response.data.code === 0;
    } catch (error) {
      console.error('注册失败:', error);
      return false;
    }
  };

  // 退出登录
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, register, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook，方便组件使用AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};