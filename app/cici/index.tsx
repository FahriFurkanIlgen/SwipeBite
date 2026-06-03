import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, Stack } from "expo-router";
import { ArrowLeft, ChevronRight, UtensilsCrossed } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useCiciStore } from "@/store/ciciStore";

export default function CiciIndex() {
  const user = useAuthStore((s) => s.user);
  const create = useCiciStore((s) => s.create);
  const joinByCode = useCiciStore((s) => s.joinByCode);
  const loading = useCiciStore((s) => s.loading);

  const [mode, setMode] = React.useState<"create" | "join">("create");
  const [code, setCode] = React.useState("");

  const handleCreate = async () => {
    if (!user) return;
    const id = await create({
      creatorId: user.id,
      creatorName: user.name,
      creatorAvatar: user.avatarUrl,
    });
    if (id) router.replace(`/cici/${id}`);
    else Alert.alert("Hata", "Oturum oluşturulamadı.");
  };

  const handleJoin = async () => {
    if (!user) return;
    if (code.trim().length < 4)
      return Alert.alert("Kod", "Lütfen geçerli bir kod gir.");
    const id = await joinByCode(code, user.name, user.avatarUrl);
    if (id) router.replace(`/cici/${id}`);
    else Alert.alert("Hata", "Bu kodla bir oturum bulunamadı.");
  };

  return (
    <Screen background="bg" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
        <Text variant="h3">Cici Boğaz</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroBadge}>
          <UtensilsCrossed size={20} color={colors.primaryDeep} />
        </View>
        <Text variant="h2" style={{ marginTop: spacing.md }}>
          Bugün dışarıdan{"\n"}ne söyleyelim?
        </Text>
        <Text variant="body" color={colors.dim} style={{ marginTop: 4 }}>
          Bir grup kur, herkes beğendiklerini kaydırsın, kazanan otomatik
          belirlensin.
        </Text>

        {/* Mode toggle */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setMode("create")}
            style={[styles.tab, mode === "create" && styles.tabActive]}
          >
            <Text
              variant="smallMedium"
              weight={mode === "create" ? "700" : "500"}
              color={mode === "create" ? colors.ink : colors.dim}
            >
              Yeni Grup
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("join")}
            style={[styles.tab, mode === "join" && styles.tabActive]}
          >
            <Text
              variant="smallMedium"
              weight={mode === "join" ? "700" : "500"}
              color={mode === "join" ? colors.ink : colors.dim}
            >
              Kodla Katıl
            </Text>
          </Pressable>
        </View>

        {mode === "create" ? (
          <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
            <Text variant="body" color={colors.dim}>
              Grup oluştur, kodu paylaş, herkes oy versin. Kazanan otomatik
              belirlenir.
            </Text>

            <Button
              title="Grup Oluştur"
              onPress={handleCreate}
              loading={loading}
              fullWidth
              rightSlot={
                <ChevronRight size={16} color={colors.ink} strokeWidth={2.5} />
              }
            />
          </View>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            <Text variant="overline" color={colors.dim}>
              6 haneli kod
            </Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="ABC123"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              style={styles.codeInput}
              placeholderTextColor={colors.hairline}
            />
            <Button
              title="Gruba Katıl"
              onPress={handleJoin}
              loading={loading}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radii.pill,
  },
  tabActive: { backgroundColor: colors.bg },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  chipOn: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 8,
    textAlign: "center",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    color: colors.ink,
  },
});
