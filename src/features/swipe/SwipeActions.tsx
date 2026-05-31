import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronsLeft, Heart, Star, X } from "lucide-react-native";
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
      {/* Super-dislike — terracotta */}
      <Pressable
        onPress={() => press("superdislike")}
        style={[
          styles.btn,
          styles.btnSmall,
          {
            backgroundColor: colors.accentSoft,
            borderWidth: 1.5,
            borderColor: colors.accent,
          },
        ]}
      >
        <ChevronsLeft size={18} color={colors.accent} strokeWidth={2} />
      </Pressable>

      {/* Dislike — white with red icon */}
      <Pressable
        onPress={() => press("dislike")}
        style={[
          styles.btn,
          {
            backgroundColor: colors.card,
            borderWidth: 1.5,
            borderColor: colors.border,
          },
          shadows.sm,
        ]}
      >
        <X size={24} color="#EF4444" strokeWidth={2} />
      </Pressable>

      {/* Like — white with green heart */}
      <Pressable
        onPress={() => press("like")}
        style={[
          styles.btn,
          {
            backgroundColor: colors.card,
            borderWidth: 1.5,
            borderColor: colors.border,
          },
          shadows.sm,
        ]}
      >
        <Heart size={22} color="#22C55E" fill="#22C55E" strokeWidth={2} />
      </Pressable>

      {/* Super-like — soft yellow with mustard star */}
      <Pressable
        onPress={() => press("superlike")}
        style={[
          styles.btn,
          styles.btnSmall,
          {
            backgroundColor: colors.primarySoft,
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
        ]}
      >
        <Star
          size={18}
          color={colors.primary}
          fill={colors.primary}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
};

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
    alignItems: "center",
    justifyContent: "center",
  },
  btnSmall: { width: 48, height: 48, borderRadius: 24 },
});
