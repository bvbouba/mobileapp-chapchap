import { getConfig } from "../config";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0"]);

/**
 * Ensure media URLs returned by backend are reachable from device/emulator.
 * Backend may return localhost URLs which are not reachable on a real device.
 */
export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;

  let normalized = url.trim();
  if (normalized.startsWith("//")) {
    normalized = `https:${normalized}`;
  }

  try {
    const mediaUrl = new URL(normalized);
    if (!LOCAL_HOSTS.has(mediaUrl.hostname)) {
      // Android cleartext is disabled — prefer https when the host supports it.
      if (mediaUrl.protocol === "http:" && !LOCAL_HOSTS.has(mediaUrl.hostname)) {
        mediaUrl.protocol = "https:";
      }
      return mediaUrl.toString();
    }

    const apiUrl = getConfig().saleorApi;
    if (!apiUrl) return mediaUrl.toString();

    const api = new URL(apiUrl);
    mediaUrl.protocol = api.protocol;
    mediaUrl.hostname = api.hostname;
    mediaUrl.port = api.port;

    return mediaUrl.toString();
  } catch {
    return normalized;
  }
};
