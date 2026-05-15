import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Text, colors } from "../Themed";

export const AccountFooter = () => (
  <View style={styles.container}>
    <View style={styles.legal}>
      <Pressable hitSlop={8}>
        <Text style={styles.link}>Légal</Text>
      </Pressable>
      <Text style={styles.dot}>·</Text>
      <Pressable hitSlop={8}>
        <Text style={styles.link}>CGU</Text>
      </Pressable>
      <Text style={styles.dot}>·</Text>
      <Pressable hitSlop={8}>
        <Text style={styles.link}>Confidentialité</Text>
      </Pressable>
    </View>
    <Text style={styles.version}>ChapChap Tickets v1.0.0</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    alignItems: "center",
    paddingVertical: 8,
  },
  legal: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  link: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: colors.blue,
  },
  dot: {
    color: colors.grey300,
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
  },
  version: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
  },
});
