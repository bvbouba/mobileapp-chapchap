import { useEffect, useRef, useState, useCallback } from "react";
import { ParsedPaymentGateways } from "./types";
import { getFilteredPaymentGateways } from "./utils";
import { useCheckout } from "../../../context/useCheckout";
import { usePaymentGatewaysInitializeMutation } from "../../../checkout/graphql";

export const usePaymentGatewaysInitialize = () => {
    const { checkout } = useCheckout();
    const [gatewayConfigs, setGatewayConfigs] = useState<ParsedPaymentGateways>([]);
    const [paymentGatewaysInitialize,result] = usePaymentGatewaysInitializeMutation();

    const billingCountry = checkout?.billingAddress?.country.code;
    const previousBillingCountry = useRef(billingCountry);

    const initialize = useCallback(async () => {
        if (!checkout?.id || !checkout?.availablePaymentGateways?.length) return;

        const filteredGateways = getFilteredPaymentGateways(checkout.availablePaymentGateways);

        try {
            const { data } = await paymentGatewaysInitialize({
				variables:{
					checkoutId: checkout.id,
					paymentGateways: filteredGateways.map((g) => ({
						id: g.id,
						data: g.config,
					})),

				}
            });

            if (data?.paymentGatewayInitialize?.gatewayConfigs) {
                setGatewayConfigs(data.paymentGatewayInitialize.gatewayConfigs as ParsedPaymentGateways);
            }
        } catch (err) {
            console.error("Failed to initialize gateways:", err);
        }
    }, [checkout?.id, checkout?.availablePaymentGateways, paymentGatewaysInitialize]);

    // Initial call
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Re-initialize if country changes
    useEffect(() => {
        if (billingCountry !== previousBillingCountry.current) {
            previousBillingCountry.current = billingCountry;
            initialize();
        }
    }, [billingCountry, initialize]);

    return {
        fetching: result.loading,
        availablePaymentGateways: gatewayConfigs,
    };
};