import { getConfig } from "../config";

const DEFAULT_STOREFRONT_URL = "https://www.chapchapticket.com";

export type StorefrontPageKey =
  | "faq"
  | "contact"
  | "about"
  | "terms"
  | "privacy";

const PAGE_PATHS: Record<StorefrontPageKey, string> = {
  faq: "contact-us",
  contact: "contact-us",
  about: "a-propos",
  terms: "conditions",
  privacy: "privacy-policy",
};

export const STOREFRONT_PAGE_TITLES: Record<StorefrontPageKey, string> = {
  faq: "FAQ & Centre d'aide",
  contact: "Nous contacter",
  about: "À propos de ChapChap",
  terms: "Conditions générales",
  privacy: "Politique de confidentialité",
};

function getStorefrontBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_STOREFRONT_URL?.trim();
  return (fromEnv || DEFAULT_STOREFRONT_URL).replace(/\/$/, "");
}

function getChannelSlug(): string {
  const channel = getConfig().channel;
  if (typeof channel === "string" && channel.trim()) return channel.trim();
  return "ci";
}

export function getStorefrontPageUrl(key: StorefrontPageKey): string {
  const base = getStorefrontBaseUrl();
  const channel = encodeURIComponent(getChannelSlug());
  const path = PAGE_PATHS[key];
  return `${base}/${channel}/${path}`;
}

/** Opens in the system browser so website login cookies work for account deletion. */
export function getAccountDeletionUrl(): string {
  const base = getStorefrontBaseUrl();
  const channel = encodeURIComponent(getChannelSlug());
  return `${base}/${channel}/accountDeletion`;
}

/** Opens in the system browser for password reset (OTP / web flow). */
export function getPasswordResetUrl(): string {
  const base = getStorefrontBaseUrl();
  const channel = encodeURIComponent(getChannelSlug());
  return `${base}/${channel}/account/resetPassword`;
}
