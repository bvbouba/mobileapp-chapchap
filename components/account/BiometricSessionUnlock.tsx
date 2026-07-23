import { useEffect, useRef } from "react";
import { useAuth } from "../lib/providers/authProvider";

/**
 * On launch, if Face ID / fingerprint was enabled, prompt immediately
 * so the user is restored without opening the login modal first.
 */
export function BiometricSessionUnlock() {
  const { loading, authenticated, biometricLoginReady, unlockWithBiometrics } = useAuth();
  const prompted = useRef(false);

  useEffect(() => {
    if (loading || authenticated || !biometricLoginReady || prompted.current) return;
    prompted.current = true;
    void unlockWithBiometrics();
  }, [loading, authenticated, biometricLoginReady, unlockWithBiometrics]);

  return null;
}
