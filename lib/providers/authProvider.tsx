import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useApolloClient } from "@apollo/client";
import { jwtDecode } from "jwt-decode";
import { 
  CurrentUserDocument, 
  useCreateTokenMutation, 
  UserDetailsFragment, 
  useRefreshTokenMutation,
} from "../../saleor/api.generated";
import { useAsyncStorage } from "../hooks/useLocalStorage";

const TOKEN = "@SaleorApp:authToken";
const REFRESH_TOKEN = "@SaleorApp:refreshToken";

interface JwtPayload {
  exp: number;
}

export interface UserConsumerProps {
  token: string | null;
  logout: () => Promise<void>;
  user: UserDetailsFragment | null;
  error: string | null;
  loading: boolean;
  authenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<UserConsumerProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const [token, setToken, tokenStorageLoading] = useAsyncStorage<string>(TOKEN, "");
  const [refreshToken, setRefreshToken, refreshStorageLoading] = useAsyncStorage<string>(REFRESH_TOKEN, "");
  const storageReady = !tokenStorageLoading && !refreshStorageLoading;
  
  const [user, setUser] = useState<UserDetailsFragment | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [createToken] = useCreateTokenMutation();
  const [tokenRefresh] = useRefreshTokenMutation();
  const loading = !storageReady || sessionLoading;

  const isTokenExpired = (t: string) => {
    try {
      const decoded: JwtPayload = jwtDecode(t);
      return Date.now() + 60_000 >= decoded.exp * 1000;
    } catch { return true; }
  };

  const fetchUser = async (currentToken: string) => {
    try {
      const { data } = await client.query({
        query: CurrentUserDocument,
        context: {
          headers: { authorization: `Bearer ${currentToken}` },
        },
        fetchPolicy: "network-only",
      });
      
      if (data?.me) {
        setUser(data.me);
        return data.me;
      }
      return null;
    } catch (err) {
      console.error("Fetch user error:", err);
      return null;
    }
  };

  const login = async ({ email, password }: { email: string; password: string }) => {
    if (!storageReady) {
      setError("Initialisation en cours, réessayez dans un instant.");
      return false;
    }
    setSessionLoading(true);
    setError(null);
    try {
      const { data } = await createToken({ variables: { email, password } });
      const newToken = data?.tokenCreate?.token;
      const newRefresh = data?.tokenCreate?.refreshToken;

      if (newToken && newRefresh) {
        await setToken(newToken);
        await setRefreshToken(newRefresh);
        const me = await fetchUser(newToken);
        if (!me) {
          await setToken("");
          await setRefreshToken("");
          setUser(null);
          setError("Connexion impossible : le profil utilisateur n'a pas pu être chargé.");
          return false;
        }
        return true;
      } else {
        setError("Identifiants incorrects ou compte inexistant.");
        return false;
      }
    } catch (err) {
      setError("Une erreur réseau est survenue.");
      return false;
    } finally {
      setSessionLoading(false);
    }
  };

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) return null;
    try {
      const { data, errors } = await tokenRefresh({ variables: { refreshToken } });
      if (errors?.length) {
        if (__DEV__) console.warn("[auth] tokenRefresh errors:", errors);
        return null;
      }
      const accountErrors = data?.tokenRefresh?.errors ?? [];
      if (accountErrors.length > 0) {
        if (__DEV__) {
          console.warn("[auth] tokenRefresh account errors:", accountErrors.map(e => e.message).join(", "));
        }
        return null;
      }
      const newToken = data?.tokenRefresh?.token;
      if (newToken) {
        await setToken(newToken);
        return newToken;
      }
    } catch (e) {
      if (__DEV__) console.warn("[auth] refresh token request failed", e);
    }
    return null;
  }, [refreshToken, setToken, tokenRefresh]);

  const logout = async () => {
    await setToken("");
    await setRefreshToken("");
    setUser(null);
    await client.clearStore(); // Important : vide le cache Apollo
  };

  useEffect(() => {
    if (!storageReady) {
      return;
    }
    let cancelled = false;

    const initAuth = async () => {
      setSessionLoading(true);
      try {
        if (!token) {
          setUser(null);
          return;
        }

        let currentToken = token;
        if (isTokenExpired(currentToken)) {
          currentToken = (await refreshAccessToken()) ?? "";
          if (!currentToken) {
            if (!cancelled) {
              setUser(null);
              await setToken("");
              await setRefreshToken("");
            }
            return;
          }
        }

        if (cancelled) return;

        let me = await fetchUser(currentToken);
        if (!me && refreshToken) {
          const refreshedToken = await refreshAccessToken();
          if (!cancelled && refreshedToken) {
            me = await fetchUser(refreshedToken);
          }
        }

        if (!cancelled && !me) {
          setUser(null);
        }
      } catch (e) {
        console.error("Init auth error", e);
      } finally {
        if (!cancelled) {
          setSessionLoading(false);
        }
      }
    };
    void initAuth();
    return () => {
      cancelled = true;
    };
  }, [storageReady, token, refreshToken, refreshAccessToken, setToken, setRefreshToken]);

  useEffect(() => {
    if (!storageReady || !token || !refreshToken) {
      return;
    }
    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        void refreshAccessToken();
      }
    }, 45_000);
    return () => clearInterval(interval);
  }, [storageReady, token, refreshToken, refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        token,
        logout,
        user,
        error,
        loading,
        authenticated: !!user,
        login,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}