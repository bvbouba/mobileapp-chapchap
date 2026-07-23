import {
  ApolloError,
  useApolloClient,
  type ApolloClient,
  type MutationFunction,
} from "@apollo/client";
import { createContext, FC, PropsWithChildren, useContext, useState } from "react";
import {
  CheckoutCompleteMutation,
  CheckoutCompleteMutationVariables,
  useCheckoutCompleteMutation,
  useCheckoutPaymentCreateMutation,
} from "../saleor/api.generated";
import { handleErrors } from "./checkout";
import { useCartContext } from "./useCartContext";
import { useOrderContext } from "./useOrderContext";
import { writeConfirmationCodeMetadata } from "../utils/writeConfirmationCodeMetadata";
import { CONFIRMATION_CODE_KEY, generateShortCode } from "../utils/generateShortCode";

interface ConfirmationData {
  id: string;
  client_secret: string;
}

interface PaymentContextModel {
  error: ApolloError | undefined;
  confirmationData: ConfirmationData | undefined;
  loading: boolean | undefined;
  startCheckout: () => Promise<void>;
  cancelPayment: () => Promise<void>;
  convertCartToOrder: () => Promise<{ orderId: string }>;
}

const PaymentContext = createContext<PaymentContextModel>({
  error: undefined,
  confirmationData: undefined,
  loading: undefined,
  startCheckout: () => Promise.resolve(),
  cancelPayment: () => Promise.resolve(),
  convertCartToOrder: () => Promise.resolve({ orderId: "" }),
});

export const usePaymentContext = () => useContext(PaymentContext);

async function attachConfirmationCode(
  client: ApolloClient<object>,
  checkoutId: string | undefined,
  completeCheckout: MutationFunction<
    CheckoutCompleteMutation,
    CheckoutCompleteMutationVariables
  >,
) {
  if (!checkoutId) {
    return {
      orderId: undefined as string | undefined,
      checkoutCompleteResult: undefined as
        | Awaited<ReturnType<typeof completeCheckout>>
        | undefined,
    };
  }
  const code = generateShortCode(checkoutId);
  const codeMeta = [{ key: CONFIRMATION_CODE_KEY, value: code }];
  await writeConfirmationCodeMetadata(client, checkoutId, code);
  const checkoutCompleteResult = await completeCheckout({
    variables: {
      checkoutId,
      metadata: codeMeta,
    },
  });
  handleErrors(checkoutCompleteResult);
  const orderId = checkoutCompleteResult.data?.checkoutComplete?.order?.id;
  if (orderId) {
    await writeConfirmationCodeMetadata(client, orderId, generateShortCode(orderId));
  }
  return { orderId, checkoutCompleteResult };
}

export const PaymentProvider: FC<PropsWithChildren> = ({ children }) => {
  const client = useApolloClient();
  const { cart } = useCartContext();
  const { setRecentOrderId: setOrderId } = useOrderContext();

  const [completeCheckout, completeCheckoutStatus] = useCheckoutCompleteMutation();
  const [createPayment, createPaymentStatus] = useCheckoutPaymentCreateMutation();

  const [confirmationData, setConfirmationData] = useState<ConfirmationData | undefined>(
    undefined,
  );
  const loading = createPaymentStatus.loading;

  const cancelPayment = async () => {
    setConfirmationData(undefined);
  };

  const startCheckout = async () => {
    try {
      const createPaymentResult = await createPayment({
        variables: {
          checkoutId: cart?.id as string,
          paymentInput: {
            amount: cart?.totalPrice.gross.amount,
            gateway: "saleor.payments.stripe",
          },
        },
      });
      handleErrors(createPaymentResult);
      const { checkoutCompleteResult } = await attachConfirmationCode(
        client,
        cart?.id,
        completeCheckout,
      );
      const raw = checkoutCompleteResult?.data?.checkoutComplete?.confirmationData;
      setConfirmationData(raw ? JSON.parse(raw) : undefined);
    } catch (e) {
      console.error(e);
    }
  };

  const convertCartToOrder = async () => {
    setConfirmationData(undefined);
    createPaymentStatus.reset();
    const { orderId } = await attachConfirmationCode(client, cart?.id, completeCheckout);
    setOrderId(orderId as string);
    return { orderId: orderId as string };
  };

  const error = completeCheckoutStatus.error || createPaymentStatus.error;

  return (
    <PaymentContext.Provider
      value={{
        loading,
        error,
        confirmationData: confirmationData,
        startCheckout,
        cancelPayment,
        convertCartToOrder,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};
