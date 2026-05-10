import Constants from 'expo-constants';

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
        saleorApi: Constants.expoConfig?.extra?.saleorApi,
        appName: Constants.expoConfig?.extra?.appName,
        bookingCutoffMinutesBeforeDeparture,
    };
};