import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useApolloClient } from "@apollo/client"; // Plus simple que de recréer l'instance
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
  const client = useApolloClient(); // On utilise l'instance déjà configurée dans App.tsx
  const [token, setToken] = useAsyncStorage(TOKEN, "");
  const [refreshToken, setRefreshToken] = useAsyncStorage(REFRESH_TOKEN, "");
  
  const [user, setUser] = useState<UserDetailsFragment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [createToken] = useCreateTokenMutation();
  const [tokenRefresh] = useRefreshTokenMutation();

  const isTokenExpired = (t: string) => {
    try {
      const decoded: JwtPayload = jwtDecode(t);
      return Date.now() >= decoded.exp * 1000;
    } catch { return true; }
  };

  // Récupérer l'utilisateur via Apollo
  const fetchUser = async (currentToken: string) => {
    try {
      const { data } = await client.query({
        query: CurrentUserDocument,
        // On passe le token explicitement pour cette requête initiale
        context: {
          headers: { authorization: `Bearer ${currentToken}` },
        },
        fetchPolicy: "network-only",
      });
      
      if (data?.me) {
        setUser(data.me);
        return data.me;
      }
    } catch (err) {
      console.error("Fetch user error:", err);
      return null;
    }
  };

  const login = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await createToken({ variables: { email, password } });
      const newToken = data?.tokenCreate?.token;
      const newRefresh = data?.tokenCreate?.refreshToken;

      if (newToken && newRefresh) {
        await setToken(newToken);
        await setRefreshToken(newRefresh);
        await fetchUser(newToken);
        return true;
      } else {
        setError("Identifiants incorrects ou compte inexistant.");
        return false;
      }
    } catch (err) {
      setError("Une erreur réseau est survenue.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) return null;
    try {
      const { data } = await tokenRefresh({ variables: { refreshToken } });
      if (data?.tokenRefresh?.token) {
        const newToken = data.tokenRefresh.token;
        await setToken(newToken);
        return newToken;
      }
    } catch {
      await logout(); // Si le refresh échoue, on déconnecte
    }
    return null;
  };

  const logout = async () => {
    await setToken("");
    await setRefreshToken("");
    setUser(null);
    await client.clearStore(); // Important : vide le cache Apollo
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        let currentToken:string | null = token;

        if (currentToken) {
          if (isTokenExpired(currentToken)) {
            currentToken = await refreshAccessToken();
          }
          
          if (currentToken) {
            await fetchUser(currentToken);
          }
        }
      } catch (e) {
        console.error("Init auth error", e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

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