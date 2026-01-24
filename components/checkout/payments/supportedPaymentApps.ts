import { DummyComponent } from "./dummy/DummyComponent";
import { dummyGatewayId } from "./dummy/types";

export type PaymentMethodMap = Record<string, React.ComponentType<any>>;

export const paymentMethodToComponent: PaymentMethodMap = {
    [dummyGatewayId]: DummyComponent,
};