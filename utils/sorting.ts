import { ProductVariantSortField, OrderDirection } from '../saleor/api.generated';

export interface SortOption {
  label: string;
  field?: ProductVariantSortField;
  direction?: OrderDirection;
  chosen: boolean;
}

export const getSortingOptions = (currentSort: { field: ProductVariantSortField, direction: OrderDirection } | null): SortOption[] => {
  const options: SortOption[] = [
    { label: "Popularité", chosen: false }, // Default/Null sort
    { label: "Moins cher", field: ProductVariantSortField.Price, direction: OrderDirection.Asc, chosen: false },
    { label: "Plus cher", field: ProductVariantSortField.Price, direction: OrderDirection.Desc, chosen: false },
  ];

  let isChosenSet = false;
  for (const option of options) {
    if (option.field === currentSort?.field && option.direction === currentSort?.direction) {
      option.chosen = true;
      isChosenSet = true;
      break;
    }
  }

  // If nothing matches, the first one (Popularité) is the active one
  if (!isChosenSet) {
    options[0].chosen = true;
  }

  return options;
};