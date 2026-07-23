import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useApolloClient } from "@apollo/client";
import { jwtDecode } from "jwt-decode";
import {
  CurrentUserDocument,
  useCreateTokenMutation,
  UserDetailsFragment,
  useRefreshTokenMutation,
} from "../../saleor/api.generated";
import {
  clearStoredSessionTokens,
  getStoredAuthToken,
  getStoredRefreshToken,
  hasStoredRefreshSession,
  isBiometricLoginEnabled,
  migrateLegacyTokensToSecureStore,
  setBiometricLoginEnabled,
  setStoredAuthToken,
  setStoredRefreshToken,
} from "../secureAuthStorage";
import { getBiometricCapability, promptBiometricUnlock } from "../biometrics";
import { setMemoryAuthToken } from "../authTokenMemory";

interface JwtPayload {
  exp: number;
}

export type LoginOptions = {
  enableBiometrics?: boolean;
};

export interface UserConsumerProps {
  token: string | null;
  logout: () => Promise<void>;
  user: UserDetailsFragment | null;
  error: string | null;
  loading: boolean;
  authenticated: boolean;
  login: (
    credentials: { email: string; password: string },
    options?: LoginOptions,
  ) => Promise<boolean>;
  refreshAccessToken: () => Promise<string | null>;
  biometricAvailable: boolean;
  biometricLoginReady: boolean;
  biometricLabel: string;
  unlockWithBiometrics: () => Promise<boolean>;
}

const AuthContext = createContext<UserConsumerProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();

  const [token, setToken] = useState<string>("");
  const [refreshToken, setRefreshToken] = useState<string>("");
  const [storageReady, setStorageReady] = useState(false);

  const [user, setUser] = useState<UserDetailsFragment | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoginReady, setBiometricLoginReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("biométrie");

  const [createToken] = useCreateTokenMutation();
  const [tokenRefresh] = useRefreshTokenMutation();
  const loading = !storageReady || sessionLoading;

  const isTokenExpired = (t: string) => {
    try {
      const decoded: JwtPayload = jwtDecode(t);
      return Date.now() + 60_000 >= decoded.exp * 1000;
    } catch {
      return true;
    }
  };

  const persistTokens = useCallback(async (auth: string, refresh: string) => {
    setToken(auth);
    setRefreshToken(refresh);
    setMemoryAuthToken(auth);
    await setStoredAuthToken(auth);
    await setStoredRefreshToken(refresh);
  }, []);

  const clearSession = useCallback(async () => {
    setToken("");
    setRefreshToken("");
    setUser(null);
    setMemoryAuthToken(null);
    await clearStoredSessionTokens();
  }, []);

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

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const currentRefresh = refreshToken || (await getStoredRefreshToken());
    if (!currentRefresh) return null;
    try {
      const { data, errors } = await tokenRefresh({
        variables: { refreshToken: currentRefresh },
      });
      if (errors?.length) {
        if (__DEV__) console.warn("[auth] tokenRefresh errors:", errors);
        return null;
      }
      const accountErrors = data?.tokenRefresh?.errors ?? [];
      if (accountErrors.length > 0) {
        if (__DEV__) {
          console.warn(
            "[auth] tokenRefresh account errors:",
            accountErrors.map((e) => e.message).join(", "),
          );
        }
        return null;
      }
      const newToken = data?.tokenRefresh?.token;
      if (newToken) {
        setToken(newToken);
        setMemoryAuthToken(newToken);
        await setStoredAuthToken(newToken);
        if (!refreshToken) setRefreshToken(currentRefresh);
        return newToken;
      }
    } catch (e) {
      if (__DEV__) console.warn("[auth] refresh token request failed", e);
    }
    return null;
  }, [refreshToken, tokenRefresh]);

  const restoreSessionFromTokens = useCallback(
    async (auth: string, refresh: string): Promise<boolean> => {
      if (!refresh) {
        setUser(null);
        return false;
      }
      setRefreshToken(refresh);

      let currentToken = auth;
      if (!currentToken || isTokenExpired(currentToken)) {
        try {
          const { data } = await tokenRefresh({ variables: { refreshToken: refresh } });
          currentToken = data?.tokenRefresh?.token ?? "";
          if (currentToken) {
            await setStoredAuthToken(currentToken);
          }
        } catch {
          currentToken = "";
        }
      }

      if (!currentToken) {
        setUser(null);
        return false;
      }

      setToken(currentToken);
      setMemoryAuthToken(currentToken);
      const me = await fetchUser(currentToken);
      if (!me) {
        setUser(null);
        setMemoryAuthToken(null);
        return false;
      }
      return true;
    },
    [client, tokenRefresh],
  );

  const login = async (
    { email, password }: { email: string; password: string },
    options?: LoginOptions,
  ) => {
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
        await persistTokens(newToken, newRefresh);
        const me = await fetchUser(newToken);
        if (!me) {
          await clearSession();
          setError("Connexion impossible : le profil utilisateur n'a pas pu être chargé.");
          return false;
        }

        if (options?.enableBiometrics) {
          const cap = await getBiometricCapability();
          if (cap.available && cap.enrolled) {
            const confirm = await promptBiometricUnlock(
              `Activer ${cap.label} pour les prochaines connexions`,
            );
            if (confirm.success) {
              await setBiometricLoginEnabled(true);
              setBiometricLoginReady(true);
            } else {
              await setBiometricLoginEnabled(false);
              setBiometricLoginReady(false);
            }
          }
        } else {
          await setBiometricLoginEnabled(false);
          setBiometricLoginReady(false);
        }

        return true;
      }
      setError("Identifiants incorrects ou compte inexistant.");
      return false;
    } catch {
      setError("Une erreur réseau est survenue.");
      return false;
    } finally {
      setSessionLoading(false);
    }
  };

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSessionLoading(true);
    try {
      const enabled = await isBiometricLoginEnabled();
      const hasRefresh = await hasStoredRefreshSession();
      if (!enabled || !hasRefresh) {
        setError("Aucune session biométrique enregistrée.");
        return false;
      }

      const cap = await getBiometricCapability();
      const prompt = await promptBiometricUnlock(`Se connecter avec ${cap.label}`);
      if (!prompt.success) {
        setError(prompt.error ?? "Biométrie annulée.");
        return false;
      }

      const auth = await getStoredAuthToken();
      const refresh = await getStoredRefreshToken();
      if (!refresh) {
        setError("Session expirée. Connectez-vous avec votre mot de passe.");
        await setBiometricLoginEnabled(false);
        setBiometricLoginReady(false);
        return false;
      }

      const ok = await restoreSessionFromTokens(auth, refresh);
      if (!ok) {
        setError("Session expirée. Connectez-vous avec votre mot de passe.");
        await clearSession();
        await setBiometricLoginEnabled(false);
        setBiometricLoginReady(false);
        return false;
      }
      return true;
    } finally {
      setSessionLoading(false);
    }
  }, [clearSession, restoreSessionFromTokens]);

  const logout = async () => {
    await clearSession();
    await setBiometricLoginEnabled(false);
    setBiometricLoginReady(false);
    await client.clearStore();
  };

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      setSessionLoading(true);
      try {
        await migrateLegacyTokensToSecureStore();

        const cap = await getBiometricCapability();
        if (!cancelled) {
          setBiometricAvailable(cap.available && cap.enrolled);
          setBiometricLabel(cap.label);
        }

        const biometricOn = await isBiometricLoginEnabled();
        const hasRefresh = await hasStoredRefreshSession();
        const ready = biometricOn && hasRefresh && cap.available && cap.enrolled;
        if (!cancelled) setBiometricLoginReady(ready);

        if (ready) {
          if (!cancelled) {
            setToken("");
            setRefreshToken("");
            setUser(null);
            setMemoryAuthToken(null);
          }
          return;
        }

        const auth = await getStoredAuthToken();
        const refresh = await getStoredRefreshToken();
        if (!refresh && !auth) {
          if (!cancelled) setUser(null);
          return;
        }

        if (!cancelled) {
          const ok = await restoreSessionFromTokens(auth, refresh);
          if (!ok) await clearSession();
        }
      } catch (e) {
        console.error("Init auth error", e);
      } finally {
        if (!cancelled) {
          setStorageReady(true);
          setSessionLoading(false);
        }
      }
    };
    void initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

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
        token: token || null,
        logout,
        user,
        error,
        loading,
        authenticated: !!user,
        login,
        refreshAccessToken,
        biometricAvailable,
        biometricLoginReady,
        biometricLabel,
        unlockWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
