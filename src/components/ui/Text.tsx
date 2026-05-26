import React from "react";
import { Text as RNText, TextProps, TextStyle, StyleSheet } from "react-native";
import { colors, typography } from "@/constants/theme";

type Variant = keyof typeof typography;

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: "400" | "500" | "600" | "700";
  align?: TextStyle["textAlign"];
}

export const Text: React.FC<AppTextProps> = ({
  variant = "body",
  color = colors.ink,
  weight,
  align,
  style,
  ...rest
}) => {
  const base = typography[variant];
  return (
    <RNText
      {...rest}
      style={[
        base,
        { color, textAlign: align },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    />
  );
};

export const styles = StyleSheet.create({});
