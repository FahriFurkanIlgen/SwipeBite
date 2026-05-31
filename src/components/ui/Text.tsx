import React from "react";
import { Text as RNText, TextProps, TextStyle, StyleSheet } from "react-native";
import { colors, fonts, typography } from "@/constants/theme";

type Variant = keyof typeof typography;
type Weight = "400" | "500" | "600" | "700";

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: Weight;
  align?: TextStyle["textAlign"];
}

const SANS_FAMILY: Record<Weight, string> = {
  "400": fonts.sans,
  "500": fonts.sansMedium,
  "600": fonts.sansSemibold,
  "700": fonts.sansBold,
};

const SERIF_VARIANTS: Variant[] = ["display", "h1", "h2", "h3", "serifItalic"];

export const Text: React.FC<AppTextProps> = ({
  variant = "body",
  color = colors.ink,
  weight,
  align,
  style,
  ...rest
}) => {
  const base = typography[variant];
  const isSerif = SERIF_VARIANTS.includes(variant);
  // For sans variants, allow weight prop to swap font family.
  const weightFamily =
    !isSerif && weight ? { fontFamily: SANS_FAMILY[weight] } : null;
  return (
    <RNText
      {...rest}
      style={[base, { color, textAlign: align }, weightFamily, style]}
    />
  );
};

export const styles = StyleSheet.create({});
