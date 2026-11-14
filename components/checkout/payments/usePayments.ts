import { useEffect } from "react";
import { useCheckout } from "../../../context/useCheckout";
import { usePaymentGatewaysInitialize } from "./usePaymentGatewaysInitialize";
import { usePaymentStatus } from "./utils";
import { PaymentStatus } from "./types";
import { useCheckoutComplete } from "../../../checkout/hooks/useCheckoutComplete";

const paidStatuses: PaymentStatus[] = ["overpaid", "paidInFull", "authorized"];

export const usePayments = () => {
  const { checkout } = useCheckout();
  const paymentStatus = usePaymentStatus(checkout);
  const { fetching, availablePaymentGateways } = usePaymentGatewaysInitialize();
  const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();

  useEffect(() => {
    // Gift-card / voucher fully covered checkouts (total 0) must be completed
    // explicitly from the checkout screen — do not auto-complete here.
    const due = checkout?.totalPrice?.gross?.amount ?? 0;
    if (due <= 0) return;

    // In Mobile, if the payment was already successful (e.g., Apple Pay callback),
    // we trigger the final Saleor completion.
    if (!completingCheckout && paidStatuses.includes(paymentStatus)) {
      onCheckoutComplete();
    }
  }, [
    checkout?.totalPrice?.gross?.amount,
    completingCheckout,
    onCheckoutComplete,
    paymentStatus,
  ]);

  return {
    fetching,
    availablePaymentGateways,
  };
};
