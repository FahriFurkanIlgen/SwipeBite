import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { Text } from "./Text";

export interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  surface?: "card" | "cream";
}

export const Input: React.FC<InputProps> = ({
  label,
  helper,
  error,
  surface = "cream",
  style,
  ...rest
}) => {
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="smallMedium" weight="600" color={colors.graphite}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.dim}
        style={[
          styles.input,
          {
            backgroundColor: surface === "card" ? colors.card : colors.cream,
          },
          error ? { borderColor: colors.danger, borderWidth: 1 } : null,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color={colors.danger}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color={colors.slate}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  input: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 15,
    fontFamily: fonts.sans,
    color: colors.ink,
  },
});
