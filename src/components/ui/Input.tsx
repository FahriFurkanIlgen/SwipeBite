import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { Text } from "./Text";

export interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helper,
  error,
  style,
  ...rest
}) => {
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="small" weight="600" color={colors.graphite}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.slate}
        style={[
          styles.input,
          error ? { borderColor: colors.danger } : null,
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
    borderWidth: 1,
    borderColor: colors.cloud,
    backgroundColor: colors.snow,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 16,
    color: colors.ink,
  },
});
