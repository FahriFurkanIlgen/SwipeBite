import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Input, Screen, Text } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { t } from "@/constants/copy";

export default function ImportScreen() {
  const [link, setLink] = React.useState("");
  const [caption, setCaption] = React.useState("");

  return (
    <Screen background="snow">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </Pressable>
        <Text variant="bodyMedium" weight="700">
          {t.import.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="small" color={colors.slate}>
          {t.import.subtitle}
        </Text>

        <Card padding="lg" style={{ gap: spacing.md }}>
          <Input
            label="Instagram bağlantısı"
            placeholder={t.import.linkPlaceholder}
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Input
            label="Caption"
            placeholder={t.import.captionPlaceholder}
            value={caption}
            onChangeText={setCaption}
            multiline
            style={{ minHeight: 120, textAlignVertical: "top" }}
          />
        </Card>

        <Card
          variant="cloud"
          padding="lg"
          style={{ alignItems: "center", gap: spacing.sm }}
        >
          <Ionicons name="image-outline" size={28} color={colors.slate} />
          <Text variant="small" color={colors.slate}>
            {t.import.screenshot}
          </Text>
        </Card>

        <Button
          title={t.import.importCta}
          fullWidth
          disabled={!link.trim() && !caption.trim()}
          onPress={() => router.back()}
          leftSlot={<Ionicons name="sparkles" size={16} color={colors.snow} />}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  scroll: { gap: spacing.lg, paddingBottom: spacing["3xl"] },
});
