export const PLATFORM_FEE_PRODUCT_SLUG = "platform-fee";

type CheckoutLineLike = {
  variant?: { product?: { slug?: string | null } | null } | null;
} | null | undefined;

export type EnsurePlatformFeeResult =
  | { ok: true }
  | {
      ok: false;
      reason: "no_channel" | "no_product" | "mutation_error";
      message?: string;
    };

/**
 * If checkout has no platform-fee line, loads the fee variant and runs checkoutLinesAdd, then refreshCart.
 * Safe to call when the fee line is already present (no-op).
 */
export async function ensurePlatformFeeLineInCheckout(options: {
  checkoutId: string;
  lines: CheckoutLineLike[] | null | undefined;
  channel: string;
  fetchProductBySlug: (args: {
    variables: { slug: string; channel: string };
    fetchPolicy?: "network-only" | "cache-first";
  }) => Promise<{ data?: { product?: { defaultVariant?: { id: string } | null } | null } | null }>;
  checkoutLinesAdd: (args: {
    variables: { id: string; lines: { quantity: number; variantId: string }[] };
  }) => Promise<{
    data?: {
      checkoutLinesAdd?: {
        errors?: Array<{ message?: string | null } | null> | null;
      } | null;
    } | null;
  }>;
  refreshCart: () => Promise<unknown>;
}): Promise<EnsurePlatformFeeResult> {
  const hasFee = options.lines?.some(
    (l) => l?.variant?.product?.slug === PLATFORM_FEE_PRODUCT_SLUG
  );
  if (hasFee) {
    return { ok: true };
  }

  if (!options.channel) {
    return { ok: false, reason: "no_channel" };
  }

  const prod = await options.fetchProductBySlug({
    variables: { slug: PLATFORM_FEE_PRODUCT_SLUG, channel: options.channel },
    fetchPolicy: "network-only",
  });

  const variantId = prod.data?.product?.defaultVariant?.id;
  if (!variantId) {
    return { ok: false, reason: "no_product" };
  }

  const res = await options.checkoutLinesAdd({
    variables: {
      id: options.checkoutId,
      lines: [{ quantity: 1, variantId: variantId }],
    },
  });

  const errors = res.data?.checkoutLinesAdd?.errors ?? [];
  if (errors.length) {
    return {
      ok: false,
      reason: "mutation_error",
      message: errors.map((e) => e?.message).filter(Boolean).join(", ") || undefined,
    };
  }

  await options.refreshCart();
  return { ok: true };
}
