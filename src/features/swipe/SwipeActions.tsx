import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, shadows } from "@/constants/theme";
import { VoteType } from "@/types/domain";

export interface SwipeActionsProps {
  onVote: (type: VoteType) => void;
}

export const SwipeActions: React.FC<SwipeActionsProps> = ({ onVote }) => {
  const press = (type: VoteType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    onVote(type);
  };
  return (
    <View style={styles.row}>
      <Action
        color={colors.superdislike}
        icon="arrow-down"
        small
        onPress={() => press("superdislike")}
      />
      <Action
        color={colors.nope}
        icon="close"
        onPress={() => press("dislike")}
      />
      <Action
        color={colors.superlike}
        icon="star"
        onPress={() => press("superlike")}
      />
      <Action color={colors.like} icon="heart" onPress={() => press("like")} />
    </View>
  );
};

const Action: React.FC<{
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  small?: boolean;
}> = ({ color, icon, onPress, small }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.btn,
      small && styles.btnSmall,
      { borderColor: color },
      pressed && { transform: [{ scale: 0.94 }] },
      shadows.sm,
    ]}
  >
    <Ionicons name={icon} size={small ? 22 : 28} color={color} />
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.snow,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSmall: { width: 48, height: 48, borderRadius: 24 },
});
