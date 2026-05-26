import React from "react";
import { SafeAreaView, StyleSheet, View, ViewProps } from "react-native";
import { colors, spacing } from "@/constants/theme";
import { StatusBar } from "expo-status-bar";

export interface ScreenProps extends ViewProps {
  background?: "canvas" | "snow" | "cloud";
  padded?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  background = "snow",
  padded = true,
  style,
  children,
  ...rest
}) => {
  const bg =
    background === "canvas"
      ? colors.canvas
      : background === "cloud"
        ? colors.cloud
        : colors.snow;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar style="dark" />
      <View
        {...rest}
        style={[
          styles.inner,
          padded && { paddingHorizontal: spacing["2xl"] },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1, paddingTop: spacing.lg, paddingBottom: spacing.lg },
});
