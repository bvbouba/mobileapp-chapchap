import { useState, useEffect } from "react";
import { useApolloClient } from "@apollo/client";
import {
  useCheckoutEmailUpdateMutation,
  useCheckoutBillingAddressUpdateMutation,
  CountryCode,
} from "../../saleor/api.generated";
import { updateCheckoutContactInfo } from "../services";
import { CheckoutFragment } from "../graphql";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";
import {
  parsePassengerRecords,
  type PassengerRecord,
} from "../../utils/passengersMetadata";
import { e164FromAccountEmail } from "../../utils/formatAccountPhone";

export const useGuestUserForm = (
  checkout: CheckoutFragment | undefined,
  onContinueToPayment?: () => void,
  accountEmail?: string | null,
) => {
  const apolloClient = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [passengers, setPassengers] = useState<PassengerRecord[]>([]);

  const [updateEmailFn] = useCheckoutEmailUpdateMutation();
  const [updateBillingFn] = useCheckoutBillingAddressUpdateMutation();

  useEffect(() => {
    if (!checkout) return;

    const tripLines =
      checkout.lines?.filter(
        (l) => l?.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
      ) ?? [];
    const quantity =
      tripLines.reduce((acc, l) => acc + (l.quantity || 0), 0) || 1;

    const existing = parsePassengerRecords({
      metadata: checkout.metadata,
      customerNote: checkout.note,
    });

    const initialPassengers = Array.from({ length: quantity }, (_, i) => ({
      firstName:
        existing[i]?.firstName ||
        checkout.billingAddress?.firstName ||
        "",
      lastName:
        existing[i]?.lastName || checkout.billingAddress?.lastName || "",
    }));

    setPassengers(initialPassengers);

    const fromBilling = (checkout.billingAddress?.phone || "").trim();
    const fromAccount = e164FromAccountEmail(accountEmail);
    const fromCheckoutEmail = e164FromAccountEmail(
      checkout.email && checkout.email !== "anonymous@chapchapticket.com"
        ? checkout.email
        : null,
    );
    setPhone(fromBilling || fromAccount || fromCheckoutEmail || "");
  }, [checkout?.id, accountEmail]);

  const handleSubmit = async () => {
    if (!checkout) return;
    setLoading(true);

    const cleanPhone = phone.replace("+", "");
    const generatedEmail = `${cleanPhone}@chapchapticket.com`;

    try {
      const result = await updateCheckoutContactInfo({
        email: generatedEmail,
        checkoutId: checkout.id,
        passengers,
        address: {
          phone,
          firstName: passengers[0]?.firstName || "",
          lastName: passengers[0]?.lastName || "",
          country: CountryCode.Ci,
          city: "Abidjan",
          streetAddress1: "Abidjan",
        },
        updateEmailFn,
        updateBillingFn,
        apolloClient,
      });

      if (result.data?.checkoutContactUpdate?.errors.length === 0) {
        onContinueToPayment?.();
      } else {
        const firstError =
          result.data?.checkoutContactUpdate?.errors[0]?.code ||
          result.data?.checkoutContactUpdate?.errors[0]?.message;
        alert(firstError || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Mutation error:", err);
      alert("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return {
    phone,
    setPhone,
    passengers,
    setPassengers,
    handleSubmit,
    loading,
  };
};
