import { useApolloClient } from "@apollo/client";
import { useRouter } from "expo-router";
import { useCheckoutCompleteMutation } from "../../saleor/api.generated";
import { useCheckout } from "../../context/useCheckout";
import { useOrderContext } from "../../context/useOrderContext";
import { useCartContext } from "../../context/useCartContext";
import { generateShortCode } from "../../utils/generateShortCode";
import { writeConfirmationCodeMetadata } from "../../utils/writeConfirmationCodeMetadata";

export const useCheckoutComplete = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { checkout } = useCheckout();
  const { setRecentOrderId: setOrderId } = useOrderContext();
  const { removeCart } = useCartContext();

  const [checkoutComplete, checkoutCompleteResult] = useCheckoutCompleteMutation();

  const onCheckoutComplete = async () => {
    if (!checkout?.id) {
      console.error("No checkout ID found");
      return;
    }

    try {
      // Customers cannot updateMetadata on Order (needs MANAGE_ORDERS).
      // 1) Write on Checkout (allowed) — Saleor copies checkout metadata onto the order.
      // 2) Pass the same code into checkoutComplete(metadata) as a second path.
      // Code is hash(checkout.id) so it is known before the order exists.
      const code = generateShortCode(checkout.id);
      const codeMeta = [{ key: "confirmation_code", value: code }];

      const checkoutWrite = await writeConfirmationCodeMetadata(
        client,
        checkout.id,
        code,
      );
      if (!checkoutWrite.ok) {
        console.warn(
          "[checkout] confirmation_code on checkout failed:",
          checkoutWrite.errorMessage,
        );
      }

      const { data, errors } = await checkoutComplete({
        variables: {
          checkoutId: checkout.id,
          metadata: codeMeta,
        },
      });

      const order = data?.checkoutComplete?.order;
      const completeErrors = data?.checkoutComplete?.errors ?? [];

      if ((errors && errors.length > 0) || completeErrors.length > 0) {
        return {
          apiErrors: errors?.length
            ? errors
            : completeErrors.map((e) => ({ message: e.message ?? "Checkout error" })),
        };
      }

      if (order) {
        // Prefer order-id hash when the API allows (staff/app). Customers usually get denied —
        // checkout-copied / checkoutComplete metadata then remains the searchable code.
        const orderCode = generateShortCode(order.id);
        const orderWrite = await writeConfirmationCodeMetadata(
          client,
          order.id,
          orderCode,
        );
        if (!orderWrite.ok && __DEV__) {
          console.warn(
            "[checkout] order confirmation_code update skipped:",
            orderWrite.errorMessage,
            "(using checkout code in metadata)",
          );
        }

        const landed =
          (order.metadata ?? []).some(
            (m) =>
              (m.key ?? "").toLowerCase() === "confirmation_code" &&
              !!(m.value ?? "").trim(),
          ) || orderWrite.ok || checkoutWrite.ok;
        if (!landed) {
          console.warn(
            "[checkout] confirmation_code may be missing on order",
            order.id,
          );
        }

        setOrderId(order.id);
        await removeCart();
        router.replace({
          pathname: "/orderConfirmation",
          params: { orderId: order.id, orderSuccess: "true" },
        });
      }

      return { data: data?.checkoutComplete };
    } catch (err: unknown) {
      console.error("Checkout completion error:", err);
      return {
        apiErrors: [
          { message: "Une erreur est survenue lors de la création de la commande." },
        ],
      };
    }
  };

  return {
    completingCheckout: checkoutCompleteResult.loading,
    onCheckoutComplete,
  };
};
