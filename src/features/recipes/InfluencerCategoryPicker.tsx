import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Sparkles, X } from "lucide-react-native";

import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import {
  INFLUENCER_CATEGORY_EMOJI,
  INFLUENCER_CATEGORY_LABEL,
  INFLUENCER_CATEGORY_ORDER,
  InfluencerCategory,
} from "@/features/recipes/influencerCategories";

export interface InfluencerCategoryPickerProps {
  visible: boolean;
  /** Tarif sayıları kategori başına — boş kategoriler gri / disabled gözükür. */
  counts: Record<InfluencerCategory, number>;
  /** Eldeki malzemelerle eşleşen kaç tarif var (toplam coverage > 50). */
  pantryAware: boolean;
  onSelect: (category: InfluencerCategory) => void;
  onClose: () => void;
}

/**
 * "Fenomen Tarifler" hızlı erişimine basıldığında çıkan kategori seçici.
 * Tek bir oturumda kahvaltı + tatlı + ana yemek karışmasın diye kullanıcı
 * önce kategoriyi seçer; deck o kategori içinden en pantry-uyumlu 12 tarif
 * ile kurulur.
 */
export const InfluencerCategoryPicker: React.FC<
  InfluencerCategoryPickerProps
> = ({ visible, counts, pantryAware, onSelect, onClose }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(180)} style={styles.fill}>
          <Pressable onPress={() => {}} style={styles.cardWrap}>
            <Animated.View
              entering={FadeInUp.delay(60).duration(260)}
              style={styles.card}
            >
              <View style={styles.headerRow}>
                <View style={styles.icon}>
                  <Sparkles size={18} strokeWidth={2} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="overline" color={colors.dim}>
                    Fenomen Tarifler
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.serif,
                      fontSize: 22,
                      lineHeight: 26,
                      color: colors.ink,
                      marginTop: 2,
                    }}
                  >
                    Hangi kategoriyi{"\n"}kaydıralım?
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <X size={18} strokeWidth={2} color={colors.slate} />
                </Pressable>
              </View>

              <Text
                variant="caption"
                color={colors.dim}
                style={{ marginTop: spacing.xs }}
              >
                {pantryAware
                  ? "Evdeki malzemelerle en uyumlu 12 tarif seçilir."
                  : "Kileri doldurursan tarifler malzemelerine göre sıralanır."}
              </Text>

              <View style={styles.grid}>
                {INFLUENCER_CATEGORY_ORDER.map((cat) => {
                  const n = counts[cat];
                  const disabled = n === 0;
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.cell, disabled && styles.cellDisabled]}
                      disabled={disabled}
                      onPress={() => onSelect(cat)}
                    >
                      <Text style={styles.cellEmoji}>
                        {INFLUENCER_CATEGORY_EMOJI[cat]}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        weight="700"
                        color={disabled ? colors.dim : colors.ink}
                        style={{ marginTop: 2 }}
                      >
                        {INFLUENCER_CATEGORY_LABEL[cat]}
                      </Text>
                      <Text variant="caption" color={colors.dim}>
                        {n} tarif
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20,18,16,0.55)",
    justifyContent: "flex-end",
  },
  fill: { flex: 1, justifyContent: "flex-end" },
  cardWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cell: {
    flexBasis: "48%",
    flexGrow: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    alignItems: "flex-start",
  },
  cellDisabled: { opacity: 0.45 },
  cellEmoji: { fontSize: 26, lineHeight: 30 },
});
