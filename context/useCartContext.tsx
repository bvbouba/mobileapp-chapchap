import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { getConfig } from "../config";
import { 
    CheckoutFragment, 
    useCheckoutLinesUpdateMutation, 
    useCreateCheckoutMutation, 
    useGetCheckoutByIdLazyQuery,
    useCheckoutDeleteLinesMutation, 
    useCheckoutAddLineMutation
} from "../saleor/api.generated";
import { getCheckoutId, removeCheckoutId, setCheckoutId } from "./basketStore";
import { handleErrors } from "./checkout";

interface CartContextModel {
    cart: CheckoutFragment | undefined;
    loaded: boolean | undefined;
    loading: boolean | undefined;
    refreshCart: () => Promise<CheckoutFragment | undefined>;
    removeCart: () => Promise<void>;
    setCart: (cart: CheckoutFragment) => void;
    addItem: (variantId: string) => Promise<void>;
    updateItemQuantity: (lineId: string, quantity: number) => Promise<void>;
}

const CartContext = createContext<CartContextModel>({
    cart: undefined,
    loading: undefined,
    loaded: undefined,
    addItem: () => Promise.resolve(),
    removeCart: () => Promise.resolve(),
    setCart: () => Function,
    refreshCart: () => Promise.resolve(undefined),
    updateItemQuantity: () => Promise.resolve(),
});

export const useCartContext = () => useContext(CartContext);

export const CartProvider: FC<PropsWithChildren> = ({ children }) => {
    const [loading, setLoading] = useState<boolean | undefined>(undefined);
    const [loaded, setLoaded] = useState<boolean | undefined>(undefined);
    const [cart, setCart] = useState<CheckoutFragment | undefined>(undefined);

    const [getCheckoutById] = useGetCheckoutByIdLazyQuery();
    const [createCheckout] = useCreateCheckoutMutation();
    const [addLineItem] = useCheckoutAddLineMutation();
    const [updateLineMutation] = useCheckoutLinesUpdateMutation();
    // 1. Initialize the Delete Mutation
    const [deleteLinesMutation] = useCheckoutDeleteLinesMutation();

    const getCheckout = async () => {
        const id = await getCheckoutId();
        const result = await getCheckoutById({ 
            variables: { id: id || "none" },
            fetchPolicy: "network-only" 
        });
        return result.data?.checkout as CheckoutFragment;
    }

    useEffect(() => {
        refreshCart();
    }, []);

    const checkCheckoutExists = async () => {
        try {
            const result = await getCheckout();
            if (!result) {
                setCart(undefined);
                await removeCheckoutId();
                return undefined;
            }
            return result;
        } catch (e) {
            await removeCheckoutId();
            setCart(undefined);
            return undefined;
        }
    };

    const addItem = async (variantId: string) => {
        setLoading(true);
        try {
            const currentCart = await checkCheckoutExists();

            if (currentCart) {
                // 2. CLEAR EXISTING LINES
                // If there are existing tickets, delete them all first
                if (currentCart.lines && currentCart.lines.length > 0) {
                    const lineIdsToDelete = currentCart.lines.map((line) => line.id);
                    await deleteLinesMutation({
                        variables: {
                            checkoutId: currentCart.id,
                            lineIds: lineIdsToDelete
                        }
                    });
                }

                // 3. ADD NEW TICKET
                const updatedCart = await addLineItem({
                    variables: {
                        id: currentCart.id,
                        productVariantId: variantId
                    }
                });
                
                setCart(updatedCart.data?.checkoutLinesAdd?.checkout as CheckoutFragment);
            } else {
                // CREATE NEW CHECKOUT
                const newCheckout = await createCheckout({
                    variables: {
                        channel: getConfig().channel,
                        lines: [{ variantId, quantity: 1 }]
                    }
                });

                const newId = newCheckout.data?.checkoutCreate?.checkout?.id;
                if (newId) {
                    await setCheckoutId(newId);
                    setCart(newCheckout.data?.checkoutCreate?.checkout as CheckoutFragment);
                }
            }
        } catch (error) {
            console.error("Error adding item:", error);
            Alert.alert("Erreur", "Impossible d'ajouter le billet au panier.");
        } finally {
            setLoading(false);
            await refreshCart();
        }
    };

    const updateItemQuantity = async (lineId: string, quantity: number) => {
        if (!cart?.id) return;
        setLoading(true);
        try {
            const updatedCart = await updateLineMutation({
                variables: {
                    id: cart.id,
                    lines: [{ lineId, quantity }]
                }
            });
            
            const errors = updatedCart.data?.checkoutLinesUpdate?.errors ?? [];
            if (errors.length > 0) {
                const firstError = errors[0];
                if (firstError?.code === "INSUFFICIENT_STOCK") {
                    Alert.alert(
                        "Stock insuffisant",
                        "Impossible d'ajouter plus de passagers: il n'y a pas assez de places disponibles pour ce trajet."
                    );
                } else {
                    const msg = firstError?.message || "Impossible de mettre a jour le panier.";
                    Alert.alert("Erreur", msg);
                }
                return;
            }

            const nextCheckout = updatedCart.data?.checkoutLinesUpdate?.checkout;
            if (nextCheckout) {
                setCart(nextCheckout as CheckoutFragment);
            } else {
                // Do not clear local cart on transient backend response gaps.
                await refreshCart();
            }
        } catch (error) {
            console.error("Error updating cart quantity:", error);
            Alert.alert("Erreur", "Impossible de mettre a jour le panier.");
        } finally {
            setLoading(false);
        }
    };

    const refreshCart = async () => {
        setLoading(true);
        try {
            const newCart = await getCheckout();
            setCart(newCart);
            return newCart;
        } catch (e) {
            setCart(undefined);
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    };

    const removeCart = async () => {
        await removeCheckoutId();
        setCart(undefined);
    }

    return (
        <CartContext.Provider value={{ cart, addItem, removeCart, updateItemQuantity, refreshCart, loading, setCart, loaded }}>
            {children}
        </CartContext.Provider>
    );
};