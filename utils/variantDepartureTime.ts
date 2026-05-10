import { ProductVariantListItemFragment } from "../saleor/api.generated";

export function getVariantDepartureTimestamp(
  variant: ProductVariantListItemFragment
): number {
  const attr = variant.attributes?.find((a) => a.attribute?.slug === "departure-time");
  const raw = attr?.values?.[0]?.value ?? attr?.values?.[0]?.name;
  if (!raw) return 0;
  const t = Date.parse(String(raw));
  return Number.isNaN(t) ? 0 : t;
}

export function sortVariantsByDepartureTime(
  variants: ProductVariantListItemFragment[],
  direction: "asc" | "desc"
): ProductVariantListItemFragment[] {
  const copy = [...variants];
  copy.sort((a, b) => {
    const ta = getVariantDepartureTimestamp(a);
    const tb = getVariantDepartureTimestamp(b);
    return direction === "asc" ? ta - tb : tb - ta;
  });
  return copy;
}
