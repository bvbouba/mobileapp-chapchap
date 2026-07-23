import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { gql } from "@apollo/client";
import {
  CONFIRMATION_CODE_KEY,
  confirmationCodeMetadataInput,
  generateShortCode,
} from "./generateShortCode";

const UpdateObjectMetadataDocument = gql`
  mutation UpdateObjectMetadata($id: ID!, $input: [MetadataInput!]!) {
    updateMetadata(id: $id, input: $input) {
      errors {
        field
        code
        message
      }
      item {
        ... on Checkout {
          id
          metadata {
            key
            value
          }
        }
        ... on Order {
          id
          metadata {
            key
            value
          }
        }
      }
    }
  }
`;

export type WriteConfirmationCodeResult = {
  ok: boolean;
  code: string;
  errorMessage?: string;
};

/**
 * Persist ticket confirmation code on Checkout or Order public metadata.
 * Pass `code` to store an explicit value (e.g. hash of order.id after complete).
 * Defaults to generateShortCode(objectId).
 */
export async function writeConfirmationCodeMetadata(
  client: ApolloClient<NormalizedCacheObject> | ApolloClient<object>,
  objectId: string,
  code?: string,
): Promise<WriteConfirmationCodeResult> {
  const value = (code ?? generateShortCode(objectId)).trim().toUpperCase();
  if (!objectId || !value) {
    return { ok: false, code: value, errorMessage: "Missing id or code" };
  }

  try {
    const result = await client.mutate({
      mutation: UpdateObjectMetadataDocument,
      variables: {
        id: objectId,
        input: [{ key: CONFIRMATION_CODE_KEY, value }],
      },
      errorPolicy: "all",
    });

    const payloadErrors = result.data?.updateMetadata?.errors ?? [];
    const topErrors = result.errors ?? [];
    if (payloadErrors.length > 0 || topErrors.length > 0) {
      const errorMessage =
        payloadErrors[0]?.message ||
        topErrors[0]?.message ||
        "updateMetadata failed";
      console.warn("[confirmation_code] write failed", objectId, errorMessage);
      return { ok: false, code: value, errorMessage };
    }

    const meta = result.data?.updateMetadata?.item?.metadata as
      | Array<{ key?: string; value?: string }>
      | undefined;
    const stored = meta?.some(
      (m) =>
        (m.key ?? "").toLowerCase() === CONFIRMATION_CODE_KEY &&
        (m.value ?? "").toUpperCase() === value,
    );
    if (meta && !stored) {
      console.warn("[confirmation_code] write returned without matching key", objectId);
      return { ok: false, code: value, errorMessage: "Metadata not present on item" };
    }

    return { ok: true, code: value };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "updateMetadata threw";
    console.warn("[confirmation_code] write threw", objectId, errorMessage);
    return { ok: false, code: value, errorMessage };
  }
}

/** @deprecated use writeConfirmationCodeMetadata — kept for call-site clarity */
export function confirmationCodeInputForId(saleorId: string) {
  return confirmationCodeMetadataInput(saleorId);
}
