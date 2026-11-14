import Constants from "expo-constants";

const PRODUCTION_SALEOR_API = "https://server.chapchapticket.com/graphql/";

function getSaleorApiUrl(): string {
  const fromPublic = process.env.EXPO_PUBLIC_SALEOR_API_URL?.trim();
  const fromExtra = (Constants.expoConfig?.extra?.saleorApi as string | undefined)?.trim();
  return fromPublic || fromExtra || PRODUCTION_SALEOR_API;
}

export const getConfig = () => {
  const raw = Constants.expoConfig?.extra?.bookingCutoffMinutesBeforeDeparture;
  const parsed =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? parseInt(raw, 10)
        : NaN;
  const bookingCutoffMinutesBeforeDeparture =
    Number.isFinite(parsed) && parsed >= 0 ? parsed : 60;

  return {
    channel: Constants.expoConfig?.extra?.channel,
    stripePK: Constants.expoConfig?.extra?.stripePK,
    locale: Constants.expoConfig?.extra?.locale,
    saleorApi: getSaleorApiUrl(),
    appName: Constants.expoConfig?.extra?.appName,
    bookingCutoffMinutesBeforeDeparture,
  };
};
