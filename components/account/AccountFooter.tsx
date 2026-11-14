import React from "react";
import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { Text, colors } from "../Themed";

const version =
  Constants.expoConfig?.version ||
  Constants.nativeAppVersion ||
  "1.0.0";

export const AccountFooter = () => (
  <View style={styles.container}>
    <Text style={styles.version}>ChapChap Ticket • v{version}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  version: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
  },
});
