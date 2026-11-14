import { useEffect, useRef } from "react";
import { useCurrentUserQuery } from "../../saleor/api.generated";
import {
  LanguageCodeEnum,
  useCheckoutAddPromoCodeMutation,
} from "../graphql";

type CheckoutGiftCardLike = {
  id?: string | null;
} | null;

/**
 * Auto-apply the logged-in customer's active avoirs (gift cards) to checkout.
 * Uses full `code` (owner-readable) via CurrentUser + checkoutAddPromoCode.
 */
export function useAutoApplyGiftCards(opts: {
  checkoutId?: string | null;
  appliedGiftCards?: CheckoutGiftCardLike[] | null;
  enabled?: boolean;
  onApplied?: () => void | Promise<unknown>;
}) {
  const { checkoutId, appliedGiftCards, enabled = true, onApplied } = opts;
  const attemptedRef = useRef<Set<string>>(new Set());

  const { data: meData } = useCurrentUserQuery({
    skip: !enabled || !checkoutId,
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });

  const [addPromoCode] = useCheckoutAddPromoCodeMutation();

  useEffect(() => {
    if (!enabled || !checkoutId) return;

    const appliedIds = new Set(
      (appliedGiftCards ?? [])
        .map((g) => g?.id)
        .filter((id): id is string => Boolean(id)),
    );

    const candidates =
      meData?.me?.giftCards?.edges
        ?.map((e) => e.node)
        .filter(
          (card) =>
            card.isActive &&
            (card.currentBalance?.amount ?? 0) > 0 &&
            Boolean(card.code) &&
            !appliedIds.has(card.id) &&
            !attemptedRef.current.has(card.id),
        ) ?? [];

    if (candidates.length === 0) return;

    let cancelled = false;

    void (async () => {
      let anyApplied = false;
      for (const card of candidates) {
        if (cancelled || !card.code) continue;
        attemptedRef.current.add(card.id);
        try {
          const res = await addPromoCode({
            variables: {
              checkoutId,
              promoCode: card.code,
              languageCode: LanguageCodeEnum.Fr,
            },
            errorPolicy: "all",
          });
          const errs = res.data?.checkoutAddPromoCode?.errors ?? [];
          if (!errs.length && !res.errors?.length) {
            anyApplied = true;
          } else {
            console.warn(
              "[avoir] auto-apply failed",
              card.displayCode,
              errs[0]?.message || res.errors?.[0]?.message,
            );
          }
        } catch (e) {
          console.warn("[avoir] auto-apply exception", card.displayCode, e);
        }
      }
      if (!cancelled && anyApplied) {
        await onApplied?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    addPromoCode,
    appliedGiftCards,
    checkoutId,
    enabled,
    meData?.me?.giftCards,
    onApplied,
  ]);
}
