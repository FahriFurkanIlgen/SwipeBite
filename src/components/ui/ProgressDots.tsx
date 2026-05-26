import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";

export const ProgressDots: React.FC<{ total: number; index: number }> = ({
  total,
  index,
}) => (
  <View style={styles.row}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          {
            backgroundColor: i <= index ? colors.ink : colors.cloud,
            width: i === index ? 28 : 8,
          },
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
});
