import { useMemo, useState, useEffect } from "react";
import { 
    useCheckoutEmailUpdateMutation,
    useCheckoutBillingAddressUpdateMutation,
    useCheckoutCustomerNoteUpdateMutation,
    CountryCode 
} from "../../saleor/api.generated";
import { updateCheckoutContactInfo } from "../services";
import { CheckoutFragment } from "../graphql";

export const useGuestUserForm = (checkout: CheckoutFragment | undefined, onContinueToPayment?: () => void) => {
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState("");
    const [passengers, setPassengers] = useState<{firstName: string, lastName: string}[]>([]);

    // These hooks return the "mutate" function as the first element in the array
    const [updateEmailFn] = useCheckoutEmailUpdateMutation();
    const [updateBillingFn] = useCheckoutBillingAddressUpdateMutation();
    const [updateNoteFn] = useCheckoutCustomerNoteUpdateMutation();

    // Initialize values from Checkout (Parsing logic remains the same)
    useEffect(() => {
        if (checkout) {
            const quantity = checkout.lines?.[0]?.quantity || 1;
            const existingNote = checkout.note?.split(";").filter(Boolean).map((p: string) => {
                const [lastName, firstName] = p.split(",");
                return { lastName: lastName || "", firstName: firstName || "" };
            }) || [];

            const initialPassengers = Array.from({ length: quantity }, (_, i) => ({
                firstName: existingNote[i]?.firstName || checkout.billingAddress?.firstName || "",
                lastName: existingNote[i]?.lastName || checkout.billingAddress?.lastName || "",
            }));

            setPassengers(initialPassengers);
            setPhone(checkout.billingAddress?.phone || "");
        }
    }, [checkout?.id]);

    const handleSubmit = async () => {
        if (!checkout) return;
        setLoading(true);

        // 1. Logic from Next.js: Generate email from phone
        const cleanPhone = phone.replace("+", "");
        const generatedEmail = `${cleanPhone}@chapchaptickets.com`;

        // 2. Format Passenger Data for Customer Note
        const customerNote = passengers
            .map((p) => `${p.lastName},${p.firstName}`)
            .join(";");

        try {
            console.log(checkout.id)
            const result = await updateCheckoutContactInfo({
                email: generatedEmail,
                checkoutId: checkout.id,
                customerNote: customerNote,
                address: {
                    phone: phone,
                    firstName: passengers[0]?.firstName || "",
                    lastName: passengers[0]?.lastName || "",
                    country: CountryCode.Ci,
                    city: "Abidjan",
                    streetAddress1: "Abidjan",
                },
                // Pass the specific mutation functions
                updateEmailFn,
                updateBillingFn,
                updateNoteFn
            });

            if (result.data?.checkoutContactUpdate?.errors.length === 0) {
                onContinueToPayment?.();
            } else {
                const firstError = result.data?.checkoutContactUpdate?.errors[0].code;
                alert(firstError || "Erreur lors de la mise à jour");
            }
        } catch (err: any) {
            console.error("Mutation error:", err);
            alert("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return { phone, setPhone, passengers, setPassengers, handleSubmit, loading };
};