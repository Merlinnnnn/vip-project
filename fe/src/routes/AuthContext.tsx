import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { login as loginApi, register as registerApi, refresh as refreshApi } from "../lib/authApi";
import type { AuthUser } from "../types/auth";

type AuthContextType = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  tryRefresh: () => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const REFRESH_KEY = "auth_refresh";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  const isAuthenticated = Boolean(token && user);

  const persist = (access: string, refresh: string, userData: AuthUser) => {
    setToken(access);
    setRefreshToken(refresh);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const logout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginApi(email, password);
      persist(res.accessToken, res.refreshToken, res.user);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const res = await registerApi(email, password, name);
      persist(res.accessToken, res.refreshToken, res.user);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const tryRefresh = useCallback(async () => {
    if (!refreshToken) return false;
    try {
      const res = await refreshApi(refreshToken);
      persist(res.accessToken, res.refreshToken, res.user);
      return true;
    } catch (err) {
      console.error("Refresh failed", err);
      logout();
      return false;
    }
  }, [logout, refreshToken]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      token,
      refreshToken,
      login,
      register,
      tryRefresh,
      logout,
    }),
    [isAuthenticated, user, token, refreshToken, login, register, tryRefresh, logout],
  );

  useEffect(() => {
    // attempt silent refresh on mount (async to avoid sync setState warning)
    void (async () => {
      await tryRefresh();
    })();
  }, [tryRefresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
