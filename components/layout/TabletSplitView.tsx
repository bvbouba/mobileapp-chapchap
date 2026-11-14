import React, { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useDeviceLayout } from "../../lib/layout/deviceLayout";

type SplitProps = {
  left: ReactNode;
  right: ReactNode;
  leftFlex?: number;
  rightFlex?: number;
  style?: StyleProp<ViewStyle>;
  leftStyle?: StyleProp<ViewStyle>;
  rightStyle?: StyleProp<ViewStyle>;
  enabled?: boolean;
};

/** Master–detail / dual pane. Falls back to a vertical stack on phones. */
export function TabletSplitView({
  left,
  right,
  leftFlex = 0.55,
  rightFlex = 0.45,
  style,
  leftStyle,
  rightStyle,
  enabled,
}: SplitProps) {
  const { useSplitLayout } = useDeviceLayout();
  const split = enabled ?? useSplitLayout;

  if (!split) {
    return (
      <View style={[styles.stack, style]}>
        <View style={leftStyle}>{left}</View>
        <View style={rightStyle}>{right}</View>
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <View style={[{ flex: leftFlex }, styles.pane, leftStyle]}>{left}</View>
      <View style={styles.divider} />
      <View style={[{ flex: rightFlex }, styles.pane, rightStyle]}>{right}</View>
    </View>
  );
}

type ShellProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  constrain?: boolean;
};

/** Centers page content and caps width on tablet landscape. */
export function TabletContentShell({
  children,
  style,
  constrain = true,
}: ShellProps) {
  const {
    useTabletLayout: isTablet,
    contentMaxWidth,
    horizontalGutter,
  } = useDeviceLayout();

  return (
    <View
      style={[
        styles.shell,
        {
          paddingHorizontal: horizontalGutter,
          maxWidth: constrain && isTablet ? contentMaxWidth : undefined,
          alignSelf: constrain && isTablet ? "center" : undefined,
          width: "100%",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  stack: {
    flex: 1,
  },
  pane: {
    minWidth: 0,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#E4E4E7",
  },
  shell: {
    flex: 1,
  },
});
