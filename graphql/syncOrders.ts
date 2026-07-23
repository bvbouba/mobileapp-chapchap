import { gql, useMutation, useLazyQuery } from "@apollo/client";
import {
  GetOrderByIdDocument,
  OrderFragment,
  OrderFragmentDoc,
  type GetOrderByIdQuery,
} from "../saleor/api.generated";

export const SyncMyOrdersDocument = gql`
  mutation syncMyOrders {
    syncMyOrders {
      linkedCount
      orderIds
      errors {
        field
        message
        code
      }
    }
  }
`;

export type SyncMyOrdersMutation = {
  syncMyOrders?: {
    linkedCount?: number | null;
    orderIds?: Array<string> | null;
    errors: Array<{
      field?: string | null;
      message?: string | null;
      code?: string | null;
    }>;
  } | null;
};

export const MyOrdersDocument = gql`
  query myOrders($first: Int = 50) {
    me {
      id
      orders(first: $first) {
        edges {
          node {
            ...Order
          }
        }
      }
    }
  }
  ${OrderFragmentDoc}
`;

export type MyOrdersQuery = {
  me?: {
    id: string;
    orders?: {
      edges: Array<{ node: OrderFragment }>;
    } | null;
  } | null;
};

export function useSyncMyOrdersMutation() {
  return useMutation<SyncMyOrdersMutation>(SyncMyOrdersDocument);
}

export function useMyOrdersLazyQuery() {
  return useLazyQuery<MyOrdersQuery>(MyOrdersDocument);
}

export { GetOrderByIdDocument };
export type { GetOrderByIdQuery };
