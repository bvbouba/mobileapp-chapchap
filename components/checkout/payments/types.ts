import { PaymentGatewayConfig } from "../../../saleor/api.generated";

export type PaymentGatewayId =
  | "app.saleor.dummy"
  | "saleor.io.dummy-payment-app"
  | "app.saleor.stripe"
  | "chapchap.paystack";

export type PaymentStatus = "paidInFull" | "overpaid" | "none" | "authorized";

export interface ParsedPaymentGateway<ID extends string, TData extends Record<string, any>>
    extends Omit<PaymentGatewayConfig, "data" | "id"> {
    data: TData;
    id: ID;
}

export type ParsedPaymentGateways = ReadonlyArray<ParsedPaymentGateway<string, any>>;
