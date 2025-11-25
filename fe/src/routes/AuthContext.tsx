import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  login as loginApi,
  register as registerApi,
  refresh as refreshApi,
  logout as logoutApi,
} from "../lib/authApi";
import type { AuthUser } from "../types/auth";

type AuthContextType = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  tryRefresh: () => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "auth_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const attemptedRefresh = useRef(false);

  const isAuthenticated = Boolean(user);

  const persistUser = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginApi(email, password);
      persistUser(res.user);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const res = await registerApi(email, password, name);
      persistUser(res.user);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const tryRefresh = useCallback(async () => {
    try {
      const res = await refreshApi();
      persistUser(res.user);
      return true;
    } catch (err) {
      console.error("Refresh failed", err);
      await logout();
      return false;
    }
  }, [logout]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      register,
      tryRefresh,
      logout,
    }),
    [isAuthenticated, user, login, register, tryRefresh, logout],
  );

  useEffect(() => {
    // attempt silent refresh once on mount
    if (attemptedRefresh.current) return;
    attemptedRefresh.current = true;
    void tryRefresh();
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
