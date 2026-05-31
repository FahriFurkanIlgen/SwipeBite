import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";

export const ProgressDots: React.FC<{ total: number; index: number }> = ({
  total,
  index,
}) => (
  <View style={styles.row}>
    {Array.from({ length: total }).map((_, i) => {
      const isCurrent = i === index;
      const isPast = i < index;
      return (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: isCurrent ? colors.primary : colors.ink,
              opacity: isCurrent || isPast ? 1 : 0.25,
              width: isCurrent ? 24 : 6,
            },
          ]}
        />
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 6, borderRadius: 3 },
});
