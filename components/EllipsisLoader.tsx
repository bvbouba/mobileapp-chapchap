import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  color?: string;
  dotSize?: number;
}

export const EllipsisLoader = ({ color = "#EB1700", dotSize = 8 }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.row}>
      {[0, 1, 2].map((idx) => (
        <View
          key={idx}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              opacity: idx === activeIndex ? 1 : 0.28,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    marginHorizontal: 3,
  },
});
