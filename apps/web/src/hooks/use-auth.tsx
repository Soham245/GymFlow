import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, tokenStore } from "@/api/client";
import { AUTH } from "@/api/endpoints";
import type { User, LoginResponse, MeResponse } from "@/api/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ success: true; data: MeResponse }>(
        AUTH.ME
      );
      setUser(data.data.user);
    } catch {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  // Boot: check for existing tokens
  useEffect(() => {
    const token = tokenStore.getAccessToken();
    if (token) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{
        success: true;
        data: LoginResponse;
      }>(AUTH.LOGIN, { email, password });

      tokenStore.setTokens(
        data.data.tokens.accessToken,
        data.data.tokens.refreshToken
      );
      setUser(data.data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStore.getRefreshToken();
      if (refreshToken) {
        await api.post(AUTH.LOGOUT, { refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      tokenStore.clear();
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
