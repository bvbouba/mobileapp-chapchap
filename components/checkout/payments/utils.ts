import { 
    CheckoutAuthorizeStatusEnum, 
    CheckoutChargeStatusEnum, 
    PaymentGateway 
} from "../../../saleor/api.generated";
import { PaymentStatus } from "./types";
import { dummyGatewayId } from "./dummy/types";
import { paystackGatewayId } from "./paystack/types";
import { paymentMethodToComponent } from "./supportedPaymentApps";

export const supportedPaymentGateways = [
  "app.saleor.dummy",
  dummyGatewayId,
  "app.saleor.stripe",
  paystackGatewayId,
] as const;

export const getFilteredPaymentGateways = (
    paymentGateways: PaymentGateway[] | null | undefined,
): PaymentGateway[] => {
    if (!paymentGateways) return [];
    return paymentGateways.filter(
      (gateway) =>
        (supportedPaymentGateways as readonly string[]).includes(gateway.id) ||
        gateway.id in paymentMethodToComponent
    );
};

export const usePaymentStatus = (checkout: any): PaymentStatus => {
    const chargeStatus = checkout?.chargeStatus;
    const authorizeStatus = checkout?.authorizeStatus;

    if (chargeStatus === CheckoutChargeStatusEnum.None && authorizeStatus === CheckoutAuthorizeStatusEnum.Full) {
        return "authorized";
    }
    if (chargeStatus === CheckoutChargeStatusEnum.Full) {
        return "paidInFull";
    }
    if (chargeStatus === CheckoutChargeStatusEnum.Overcharged) {
        return "overpaid";
    }
    return "none";
};
