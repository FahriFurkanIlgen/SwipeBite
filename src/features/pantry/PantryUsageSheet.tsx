import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Check, Package, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { Recipe } from "@/types/domain";
import { usePantryStore } from "@/store/pantryStore";
import { pantryItemsUsedByRecipe } from "@/features/pantry/pantryMatcher";

export interface PantryUsageSheetProps {
  visible: boolean;
  recipe: Recipe;
  onClose: () => void;
  /** Called after the selected items were removed (or none were used). */
  onDone?: () => void;
}

/**
 * Bottom sheet shown after a recipe is cooked. Lists the pantry items the
 * recipe likely consumed and lets the user remove them in one tap. Staple
 * items (spices, oil, nuts) are pre-deselected so they aren't deleted by
 * accident. Shared by the step-by-step cook screen and the recipe detail
 * "Pişirdim" action.
 */
export const PantryUsageSheet: React.FC<PantryUsageSheetProps> = ({
  visible,
  recipe,
  onClose,
  onDone,
}) => {
  const pantry = usePantryStore((s) => s.items);
  const removePantryItem = usePantryStore((s) => s.remove);
  const [removing, setRemoving] = React.useState(false);

  const used = React.useMemo(
    () => pantryItemsUsedByRecipe(recipe, pantry),
    [recipe, pantry],
  );

  // Selected ids, seeded with the non-staple matches each time the sheet opens.
  const [removeIds, setRemoveIds] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    if (visible) {
      setRemoveIds(
        new Set(used.filter((u) => !u.staple).map((u) => u.item.id)),
      );
    }
    // Only reseed when the sheet is (re)opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggle = (itemId: string) => {
    void Haptics.selectionAsync();
    setRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleConfirm = async () => {
    const ids = [...removeIds];
    if (ids.length > 0) {
      setRemoving(true);
      try {
        await Promise.all(
          ids.map((rid) => removePantryItem(rid).catch(() => undefined)),
        );
      } finally {
        setRemoving(false);
      }
    }
    onDone?.();
    onClose();
  };

  const count = removeIds.size;

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
                  <Package size={18} strokeWidth={2} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="overline" color={colors.dim}>
                    Kileri güncelle
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
                    Ne kullandın?
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <X size={18} strokeWidth={2} color={colors.slate} />
                </Pressable>
              </View>

              <Text
                variant="caption"
                color={colors.dim}
                style={{ marginTop: spacing.xs, marginBottom: spacing.md }}
              >
                {used.length > 0
                  ? "Kullandığın malzemeleri kilerden düşelim."
                  : "Bu tarifte kilerinden eşleşen malzeme yok."}
              </Text>

              {used.length > 0 ? (
                <ScrollView
                  style={{ maxHeight: 320 }}
                  showsVerticalScrollIndicator={false}
                >
                  {used.map(({ item }) => {
                    const checked = removeIds.has(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => toggle(item.id)}
                        style={styles.row}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            checked && styles.checkboxOn,
                          ]}
                        >
                          {checked ? (
                            <Check
                              size={13}
                              color={colors.ink}
                              strokeWidth={3}
                            />
                          ) : null}
                        </View>
                        <Text
                          variant="bodyMedium"
                          color={colors.ink}
                          style={{ flex: 1 }}
                        >
                          {item.name}
                        </Text>
                        {item.quantity ? (
                          <Text variant="caption" color={colors.dim}>
                            {item.quantity}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              <Pressable
                onPress={handleConfirm}
                disabled={removing}
                style={[styles.cta, removing && { opacity: 0.6 }]}
              >
                <Text variant="bodyMedium" weight="700" color={colors.ink}>
                  {removing
                    ? "Güncelleniyor…"
                    : count > 0
                      ? `Kileri güncelle (${count})`
                      : "Tamam"}
                </Text>
              </Pressable>
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
    backgroundColor: "rgba(26,23,20,0.45)",
  },
  fill: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardWrap: {
    width: "100%",
  },
  card: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cta: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
});
