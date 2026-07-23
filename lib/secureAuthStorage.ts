import * as SecureStore from "expo-secure-store";
import { customStorage } from "../utils/customStorage";

/** Secure keys for Saleor session tokens (device keychain / Keystore). */
const AUTH_TOKEN_KEY = "chapchap.authToken";
const REFRESH_TOKEN_KEY = "chapchap.refreshToken";
/** Preference flag — also mirrored in SecureStore. */
const BIOMETRIC_ENABLED_KEY = "chapchap.biometricEnabled";

/** Legacy AsyncStorage keys used before SecureStore migration. */
const LEGACY_AUTH_TOKEN = "@SaleorApp:authToken";
const LEGACY_REFRESH_TOKEN = "@SaleorApp:refreshToken";

async function secureGet(key: string): Promise<string | null> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return;
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (e) {
    if (__DEV__) console.warn("[secureAuth] set failed", key, e);
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return;
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

function parseLegacyStored(raw: string | null): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}

/** Migrate tokens from AsyncStorage → SecureStore once, then clear legacy keys. */
export async function migrateLegacyTokensToSecureStore(): Promise<void> {
  const existingRefresh = await secureGet(REFRESH_TOKEN_KEY);
  if (existingRefresh) {
    // Already migrated / has secure session.
    try {
      await customStorage.removeItem(LEGACY_AUTH_TOKEN);
      await customStorage.removeItem(LEGACY_REFRESH_TOKEN);
    } catch {
      // ignore
    }
    return;
  }

  try {
    const legacyAuth = parseLegacyStored(await customStorage.getItem(LEGACY_AUTH_TOKEN));
    const legacyRefresh = parseLegacyStored(await customStorage.getItem(LEGACY_REFRESH_TOKEN));
    if (legacyAuth) await secureSet(AUTH_TOKEN_KEY, legacyAuth);
    if (legacyRefresh) await secureSet(REFRESH_TOKEN_KEY, legacyRefresh);
    await customStorage.removeItem(LEGACY_AUTH_TOKEN);
    await customStorage.removeItem(LEGACY_REFRESH_TOKEN);
  } catch (e) {
    if (__DEV__) console.warn("[secureAuth] migration failed", e);
  }
}

export async function getStoredAuthToken(): Promise<string> {
  return (await secureGet(AUTH_TOKEN_KEY)) ?? "";
}

export async function getStoredRefreshToken(): Promise<string> {
  return (await secureGet(REFRESH_TOKEN_KEY)) ?? "";
}

export async function setStoredAuthToken(token: string): Promise<void> {
  if (!token) {
    await secureDelete(AUTH_TOKEN_KEY);
    return;
  }
  await secureSet(AUTH_TOKEN_KEY, token);
}

export async function setStoredRefreshToken(token: string): Promise<void> {
  if (!token) {
    await secureDelete(REFRESH_TOKEN_KEY);
    return;
  }
  await secureSet(REFRESH_TOKEN_KEY, token);
}

export async function clearStoredSessionTokens(): Promise<void> {
  await secureDelete(AUTH_TOKEN_KEY);
  await secureDelete(REFRESH_TOKEN_KEY);
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  const v = await secureGet(BIOMETRIC_ENABLED_KEY);
  return v === "1" || v === "true";
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await secureSet(BIOMETRIC_ENABLED_KEY, "1");
  } else {
    await secureDelete(BIOMETRIC_ENABLED_KEY);
  }
}

export async function hasStoredRefreshSession(): Promise<boolean> {
  const refresh = await getStoredRefreshToken();
  return refresh.length > 0;
}
