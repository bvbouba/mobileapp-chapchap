import { 
    CheckoutAuthorizeStatusEnum, 
    CheckoutChargeStatusEnum, 
    PaymentGateway 
} from "../../../saleor/api.generated";
import { PaymentStatus } from "./types";

export const supportedPaymentGateways = ["app.saleor.dummy", "app.saleor.stripe"] as const;

export const getFilteredPaymentGateways = (
    paymentGateways: PaymentGateway[] | null | undefined,
): PaymentGateway[] => {
    if (!paymentGateways) return [];
    return paymentGateways.filter((gateway) => 
        supportedPaymentGateways.includes(gateway.id as any)
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