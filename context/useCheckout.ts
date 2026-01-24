import { useEffect, useState, useMemo } from "react";
import { 
    useCheckoutLazyQuery, 
    Checkout, 
    LanguageCodeEnum 
} from "../checkout/graphql"; 
import { getCheckoutId } from "../context/basketStore";

export const useCheckout = () => {
    const [fetching, setFetching] = useState(true);
    const [checkout, setCheckout] = useState<Checkout | undefined>(undefined);

    const [getCheckout] = useCheckoutLazyQuery();

    const loadCheckout = async () => {
        setFetching(true);
        try {
            const id = await getCheckoutId();

            if (id) {
                const result = await getCheckout({
                    variables: { 
                        id, 
                        languageCode: LanguageCodeEnum.Fr 
                    },
                    fetchPolicy: "network-only",
                });

                if (result.data?.checkout) {
                    setCheckout(result.data.checkout as Checkout);
                }
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du checkout:", error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        loadCheckout();
    }, []);

    return useMemo(
        () => ({ 
            checkout, 
            fetching, 
            refetch: loadCheckout 
        }),
        [checkout, fetching]
    );
};