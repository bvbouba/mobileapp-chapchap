import { gql } from "@apollo/client";
import type { ApolloClient } from "@apollo/client";
import {
  AddressInput,
  CheckoutEmailUpdateMutationFn,
  CheckoutBillingAddressUpdateMutationFn,
  CountryCode,
} from "../saleor/api.generated";
import {
  passengersMetadataInput,
  type PassengerRecord,
} from "../utils/passengersMetadata";

const UpdateCheckoutPassengersMetadataDocument = gql`
  mutation UpdateCheckoutPassengersMetadata(
    $id: ID!
    $input: [MetadataInput!]!
  ) {
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
      }
    }
  }
`;

type UpdateCheckoutContactInfoArgs = {
  email: string;
  checkoutId: string;
  address: AddressInput;
  passengers: PassengerRecord[];
  updateEmailFn: CheckoutEmailUpdateMutationFn;
  updateBillingFn: CheckoutBillingAddressUpdateMutationFn;
  apolloClient: ApolloClient<object>;
};

export const updateCheckoutContactInfo = async ({
  email,
  checkoutId,
  address,
  passengers,
  updateEmailFn,
  updateBillingFn,
  apolloClient,
}: UpdateCheckoutContactInfoArgs) => {
  try {
    const { data: emailData } = await updateEmailFn({
      variables: {
        id: checkoutId,
        email,
      },
    });

    const { data: billingData } = await updateBillingFn({
      variables: {
        id: checkoutId,
        billingAddress: address,
      },
    });

    const metaResult = await apolloClient.mutate({
      mutation: UpdateCheckoutPassengersMetadataDocument,
      variables: {
        id: checkoutId,
        input: [passengersMetadataInput(passengers)],
      },
      errorPolicy: "all",
    });

    const metaErrors = metaResult.data?.updateMetadata?.errors ?? [];
    const metaGqlErrors = metaResult.errors ?? [];

    const checkout =
      billingData?.checkoutBillingAddressUpdate?.checkout ||
      emailData?.checkoutEmailUpdate?.checkout;

    const errors = [
      ...(emailData?.checkoutEmailUpdate?.errors || []),
      ...(billingData?.checkoutBillingAddressUpdate?.errors || []),
      ...metaErrors.map((e: { message?: string | null; code?: string | null }) => ({
        message: e.message,
        code: e.code || "METADATA_ERROR",
        field: e.message ? "metadata" : null,
      })),
      ...metaGqlErrors.map((e) => ({
        message: e.message,
        code: "METADATA_ERROR",
        field: "metadata",
      })),
    ];

    return {
      data: {
        checkoutContactUpdate: { checkout, errors },
      },
      error: undefined,
    };
  } catch (err: unknown) {
    return {
      data: undefined,
      error: err,
    };
  }
};

export type { CountryCode };
