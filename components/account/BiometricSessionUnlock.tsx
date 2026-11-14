import { useEffect, useRef } from "react";
import { useAuth } from "../../lib/providers/authProvider";

/**
 * On launch (and after logout), if Face ID / fingerprint was enabled,
 * prompt so the user is restored without opening the login modal first.
 */
export function BiometricSessionUnlock() {
  const { loading, authenticated, biometricLoginReady, unlockWithBiometrics } = useAuth();
  const prompted = useRef(false);

  // After a successful session, allow another auto-prompt on the next logout.
  useEffect(() => {
    if (authenticated) {
      prompted.current = false;
    }
  }, [authenticated]);

  useEffect(() => {
    if (loading || authenticated || !biometricLoginReady || prompted.current) return;
    prompted.current = true;
    void unlockWithBiometrics();
  }, [loading, authenticated, biometricLoginReady, unlockWithBiometrics]);

  return null;
}
