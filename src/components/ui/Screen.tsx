import React from "react";
import { SafeAreaView, StyleSheet, View, ViewProps } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors, spacing } from "@/constants/theme";

type Background = "bg" | "card" | "cream" | "ink" | "snow" | "canvas" | "cloud";

export interface ScreenProps extends ViewProps {
  background?: Background;
  padded?: boolean;
  statusBar?: "dark" | "light" | "auto";
  edges?: boolean;
}

const BG: Record<Background, string> = {
  bg: colors.bg,
  card: colors.card,
  cream: colors.cream,
  ink: colors.ink,
  snow: colors.card,
  canvas: colors.bg,
  cloud: colors.cream,
};

export const Screen: React.FC<ScreenProps> = ({
  background = "bg",
  padded = true,
  statusBar,
  edges = true,
  style,
  children,
  ...rest
}) => {
  const bg = BG[background];
  const Container: React.ComponentType<ViewProps> = edges
    ? (SafeAreaView as never)
    : View;
  const sbStyle = statusBar ?? (background === "ink" ? "light" : "dark");
  return (
    <Container style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar style={sbStyle} />
      <View
        {...rest}
        style={[
          styles.inner,
          padded && { paddingHorizontal: spacing.xl },
          style,
        ]}
      >
        {children}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
});
