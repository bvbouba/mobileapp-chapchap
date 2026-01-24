import { 
    AddressInput, 
    CheckoutEmailUpdateMutationFn, 
    CheckoutBillingAddressUpdateMutationFn, 
    LanguageCodeEnum,
    CheckoutCustomerNoteUpdateMutationFn
 } from "../saleor/api.generated";

type UpdateCheckoutContactInfoArgs = {
    email: string;
    checkoutId: string;
    address: AddressInput;
    customerNote: string;
    // Pass the actual mutation function types from generated code
    updateEmailFn: CheckoutEmailUpdateMutationFn;
    updateBillingFn: CheckoutBillingAddressUpdateMutationFn;
    updateNoteFn: CheckoutCustomerNoteUpdateMutationFn;
};

export const updateCheckoutContactInfo = async ({
    email,
    checkoutId,
    address,
    customerNote,
    updateEmailFn,
    updateBillingFn,
    updateNoteFn
}: UpdateCheckoutContactInfoArgs) => {
    try {
        // Step 1: Email update
        // FIX: Ensure you use 'id' or 'checkoutId' based on your specific GraphQL definition
        const { data: emailData } = await updateEmailFn({
            variables: { 
                id: checkoutId,
                email,
            },
        });
        // Step 2: Billing Address
        const { data: billingData } = await updateBillingFn({
            variables: { 
                id: checkoutId, 
                billingAddress: address,
            },
        });

        // Step 3: Customer Note
        const { data: noteData } = await updateNoteFn({
            variables: { 
                checkoutId: checkoutId, 
                customerNote,
            },
        });

        // Merge logic exactly like your Next.js app
        const checkout = 
            noteData?.checkoutCustomerNoteUpdate?.checkout || 
            billingData?.checkoutBillingAddressUpdate?.checkout || 
            emailData?.checkoutEmailUpdate?.checkout;

        const errors = [
            ...(emailData?.checkoutEmailUpdate?.errors || []),
            ...(billingData?.checkoutBillingAddressUpdate?.errors || []),
            ...(noteData?.checkoutCustomerNoteUpdate?.errors || []),
        ];

        return {
            data: {
                checkoutContactUpdate: { checkout, errors },
            },
            error: undefined,
        };
    } catch (err: any) {
        return {
            data: undefined,
            error: err,
        };
    }
};