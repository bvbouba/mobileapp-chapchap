import { gql, useApolloClient } from "@apollo/client";
import { useEffect, useState } from "react";
import { resolveMediaUrl } from "../utils/mediaUrl";

const LOGO_META_KEY = "logo_url";
const DEFAULT_STOREFRONT = "https://www.chapchapticket.com";

/**
 * Last-resort logos when storefront BFF is unavailable and categories lack
 * logo_url. Keys must match bus-operator attribute value slugs (= channel slugs).
 * Prefer /api/operator-logos once deployed.
 */
const BUILTIN_OPERATOR_LOGOS: Record<string, string> = {
  "operator-a":
    "https://server.chapchapticket.com/media/file_upload/operator-a-logo_033e549c.png",
  "operator-b":
    "https://server.chapchapticket.com/media/file_upload/operator-b-logo_b4f6f3ea.jpg",
};

/** Public category may mirror operator channel metadata. */
const OperatorCompanyBySlugDocument = gql`
  query OperatorCompanyBySlug($slug: String!) {
    category(slug: $slug) {
      id
      slug
      name
      metadata {
        key
        value
      }
    }
  }
`;

type OperatorCompanyResult = {
  category?: {
    slug?: string | null;
    metadata?: Array<{ key: string; value: string }> | null;
  } | null;
};

const logoCache = new Map<string, string | undefined>();
const inflight = new Map<string, Promise<string | undefined>>();
let mapInflight: Promise<Record<string, string>> | null = null;
let mapCache: Record<string, string> | null = null;

function metaValue(
  metadata: Array<{ key: string; value: string }> | null | undefined,
  key: string,
): string {
  const hit = (metadata ?? []).find((m) => m.key === key);
  return (hit?.value ?? "").trim();
}

function pickLogoFromProduct(node: {
  thumbnail?: { url?: string | null } | null;
  media?: Array<{ url?: string | null; type?: string | null } | null> | null;
}): string | undefined {
  const fromThumb = resolveMediaUrl(node.thumbnail?.url);
  if (fromThumb) return fromThumb;
  const image = (node.media ?? []).find(
    (m) => (m?.type ?? "").toUpperCase() === "IMAGE" && m?.url,
  );
  return resolveMediaUrl(image?.url ?? node.media?.[0]?.url);
}

function getStorefrontBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_STOREFRONT_URL?.trim();
  return (fromEnv || DEFAULT_STOREFRONT).replace(/\/$/, "");
}

async function fetchLogoMapFromStorefrontApi(): Promise<Record<string, string>> {
  if (mapCache) return mapCache;
  if (mapInflight) return mapInflight;

  mapInflight = (async () => {
    try {
      const base = getStorefrontBaseUrl();
      const res = await fetch(`${base}/api/operator-logos`, { method: "GET" });
      if (!res.ok) return {};
      const data = (await res.json()) as { logos?: Record<string, string | null> };
      const out: Record<string, string> = {};
      for (const [slug, url] of Object.entries(data.logos ?? {})) {
        const resolved = resolveMediaUrl(url);
        if (resolved) out[slug] = resolved;
      }
      mapCache = out;
      return out;
    } catch {
      return {};
    } finally {
      mapInflight = null;
    }
  })();

  return mapInflight;
}

async function fetchLogoFromCategory(
  client: ReturnType<typeof useApolloClient>,
  slug: string,
): Promise<string | undefined> {
  try {
    const res = await client.query<OperatorCompanyResult>({
      query: OperatorCompanyBySlugDocument,
      variables: { slug },
      fetchPolicy: "cache-first",
    });
    const raw = metaValue(res.data?.category?.metadata, LOGO_META_KEY);
    return resolveMediaUrl(raw) || undefined;
  } catch {
    return undefined;
  }
}

async function fetchOperatorLogoUrl(
  client: ReturnType<typeof useApolloClient>,
  slug: string,
): Promise<string | undefined> {
  if (logoCache.has(slug)) return logoCache.get(slug);

  const existing = inflight.get(slug);
  if (existing) return existing;

  const run = (async () => {
    try {
      const map = await fetchLogoMapFromStorefrontApi();
      const fromApi = resolveMediaUrl(map[slug]);
      if (fromApi) {
        logoCache.set(slug, fromApi);
        return fromApi;
      }

      const fromCategory = await fetchLogoFromCategory(client, slug);
      if (fromCategory) {
        logoCache.set(slug, fromCategory);
        return fromCategory;
      }

      const builtin = resolveMediaUrl(BUILTIN_OPERATOR_LOGOS[slug]);
      logoCache.set(slug, builtin);
      return builtin;
    } catch {
      const builtin = resolveMediaUrl(BUILTIN_OPERATOR_LOGOS[slug]);
      logoCache.set(slug, builtin);
      return builtin;
    } finally {
      inflight.delete(slug);
    }
  })();

  inflight.set(slug, run);
  return run;
}

/**
 * Operator company logo: storefront API → category metadata → builtin → product media.
 */
export function useOperatorLogo(opts: {
  productLogoUrl?: string | null;
  operatorChannelSlug?: string | null;
}): string | undefined {
  const client = useApolloClient();
  const productLogo = resolveMediaUrl(opts.productLogoUrl);
  const channel = (opts.operatorChannelSlug ?? "").trim();
  const [channelLogo, setChannelLogo] = useState<string | undefined>(() => {
    if (!channel) return undefined;
    if (logoCache.has(channel)) return logoCache.get(channel);
    return resolveMediaUrl(BUILTIN_OPERATOR_LOGOS[channel]);
  });

  useEffect(() => {
    if (!channel) {
      setChannelLogo(undefined);
      return;
    }
    if (logoCache.has(channel)) {
      setChannelLogo(logoCache.get(channel));
      return;
    }

    let cancelled = false;
    void fetchOperatorLogoUrl(client, channel).then((url) => {
      if (!cancelled) setChannelLogo(url);
    });

    return () => {
      cancelled = true;
    };
  }, [channel, client]);

  return channelLogo || productLogo || undefined;
}

export function resolveProductLogoUrl(product?: {
  thumbnail?: { url?: string | null } | null;
  media?: Array<{ url?: string | null; type?: string | null } | null> | null;
} | null): string | undefined {
  if (!product) return undefined;
  return pickLogoFromProduct(product);
}
