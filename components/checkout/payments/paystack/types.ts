import { ImageSourcePropType } from "react-native";

export const paystackGatewayId = "chapchap.paystack";
export type PaystackGatewayId = typeof paystackGatewayId;

export type CiMomoProvider = "orange" | "mtn" | "wave";

export const CI_MOMO_PROVIDERS: {
  code: CiMomoProvider;
  label: string;
  logo: ImageSourcePropType;
}[] = [
  {
    code: "orange",
    label: "Orange Money",
    logo: require("../../../../assets/images/logo/orange.png"),
  },
  {
    code: "mtn",
    label: "MTN MoMo",
    logo: require("../../../../assets/images/logo/mtn.png"),
  },
  {
    code: "wave",
    label: "Wave",
    logo: require("../../../../assets/images/logo/wave.png"),
  },
];

export type PaystackMomoInitializeData = {
  mode?: "mobile_money";
  provider?: CiMomoProvider;
  reference?: string;
  status?: string;
  displayText?: string;
  openUrl?: string | null;
  exception?: boolean;
};
