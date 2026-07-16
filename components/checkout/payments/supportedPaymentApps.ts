import { ImageSourcePropType } from "react-native";
import { DummyComponent } from "./dummy/DummyComponent";
import { dummyGatewayId } from "./dummy/types";
import { PaystackComponent } from "./paystack/PaystackComponent";
import { paystackGatewayId } from "./paystack/types";

export type PaymentMethodMap = Record<string, React.ComponentType<any>>;

export const paymentMethodToComponent: PaymentMethodMap = {
  [dummyGatewayId]: DummyComponent,
  [paystackGatewayId]: PaystackComponent,
};

export type PaymentMethodMeta = {
  id: string;
  label: string;
  logo: ImageSourcePropType;
};

export const paymentMethodMetaById: Record<string, PaymentMethodMeta> = {
  [dummyGatewayId]: {
    id: dummyGatewayId,
    label: "Passerelle de Test",
    logo: require("../../../assets/images/logo/dummy.png"),
  },
  [paystackGatewayId]: {
    id: paystackGatewayId,
    label: "Paystack",
    logo: require("../../../assets/images/logo/paystack.png"),
  },
};

export function getPaymentMethodMeta(gatewayId: string): PaymentMethodMeta {
  if (paymentMethodMetaById[gatewayId]) {
    return paymentMethodMetaById[gatewayId];
  }
  if (gatewayId.includes("dummy")) {
    return paymentMethodMetaById[dummyGatewayId];
  }
  if (gatewayId.includes("paystack")) {
    return paymentMethodMetaById[paystackGatewayId];
  }
  return {
    id: gatewayId,
    label: "Paiement",
    logo: require("../../../assets/images/logo/paystack.png"),
  };
}
