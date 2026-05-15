import { useMemo } from "react";
import { useRouter } from "expo-router";
import { useCheckoutCompleteMutation } from "../../saleor/api.generated";
import { useCheckout } from "../../context/useCheckout";
import { useOrderContext } from "../../context/useOrderContext";
import { useCartContext } from "../../context/useCartContext";

export const useCheckoutComplete = () => {
    const router = useRouter();
    const { checkout } = useCheckout();
    const { setRecentOrderId: setOrderId } = useOrderContext();
    const { removeCart } = useCartContext();

    const [checkoutComplete,checkoutCompleteResult] = useCheckoutCompleteMutation();

    const onCheckoutComplete = async () => {
        if (!checkout?.id) {
            console.error("No checkout ID found");
            return;
        }

        try {
            const { data, errors } = await checkoutComplete({
                variables: {
                    checkoutId: checkout.id, 
                },
            });


            const order = data?.checkoutComplete?.order;

            if (errors && errors.length > 0) {
                return { apiErrors: errors };
            }
            
            if (order) {
                setOrderId(order.id)
                await removeCart();
                router.replace({
                    pathname: "/orderConfirmation",
                    params: { orderId: order.id, orderSuccess: 'true' }
                });
            }

            return { data: data?.checkoutComplete };
        } catch (err: any) {
            console.error("Checkout completion error:", err);
            return { apiErrors: [{ message: "Une erreur est survenue lors de la création de la commande." }] };
        }
    };

    return { 
        completingCheckout: checkoutCompleteResult.loading, 
        onCheckoutComplete 
    };
};