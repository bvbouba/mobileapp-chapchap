import { type OrderFragment, useOrderQuery } from "../graphql";
import { useLocalSearchParams } from "expo-router";
import { LanguageCodeEnum } from "../graphql";

export const useOrder = () => {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();

    const { data, loading } = useOrderQuery({
        skip: !orderId,
        variables: { 
            languageCode: LanguageCodeEnum.Fr, 
            id: orderId 
        },
    });

    return { 
        order: data?.order as OrderFragment, 
        loading 
    };
};