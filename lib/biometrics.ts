import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export type BiometricCapability = {
  available: boolean;
  enrolled: boolean;
  /** Face ID / fingerprint / iris depending on hardware. */
  label: string;
};

function biometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
  const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const hasFinger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
  const hasIris = types.includes(LocalAuthentication.AuthenticationType.IRIS);

  // Prefer fingerprint on Android when both exist (Face ID branding is iOS-only;
  // many Android devices expose both but users unlock with the finger sensor).
  if (hasFace && hasFinger) {
    return Platform.OS === "ios" ? "Face ID" : "empreinte";
  }
  if (hasFace) {
    return Platform.OS === "ios" ? "Face ID" : "visage";
  }
  if (hasFinger) {
    return Platform.OS === "ios" ? "Touch ID" : "empreinte";
  }
  if (hasIris) {
    return "Iris";
  }
  return "biométrie";
}


export async function getBiometricCapability(): Promise<BiometricCapability> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return { available: false, enrolled: false, label: "biométrie" };
    }
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return {
      available: true,
      enrolled,
      label: biometricLabel(types),
    };
  } catch {
    return { available: false, enrolled: false, label: "biométrie" };
  }
}

export async function promptBiometricUnlock(promptMessage?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const cap = await getBiometricCapability();
    if (!cap.available || !cap.enrolled) {
      return {
        success: false,
        error: "Biométrie indisponible ou non configurée sur cet appareil.",
      };
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage:
        promptMessage ?? `Déverrouiller avec ${cap.label}`,
      cancelLabel: "Annuler",
      disableDeviceFallback: false,
      fallbackLabel: "Utiliser le code appareil",
    });
    if (result.success) return { success: true };
    return {
      success: false,
      error: "Authentification biométrique annulée ou échouée.",
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur biométrique.",
    };
  }
}
