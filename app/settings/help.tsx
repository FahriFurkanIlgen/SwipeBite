import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, spacing } from "@/constants/theme";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Bir oturum nasıl başlatılır?",
    a: "Ana sayfa veya Eşleş sekmesinden 'Yeni oturum başlat'a dokun. Hane üyelerin davet kodu/link ile katılır, sonra tarif kartlarını kaydırırsınız.",
  },
  {
    q: "Eşleşme nasıl olur?",
    a: "İki kişi de aynı tarife sağa kaydırdığında otomatik olarak eşleşme oluşur ve pop-up gösterilir.",
  },
  {
    q: "Hane'ye nasıl davet ederim?",
    a: "Profil → Ev Halkı → 'Davet et' butonu ile davet kodu/link paylaşabilirsin. Karşı taraf linki açtığında otomatik katılır.",
  },
  {
    q: "Kiler nasıl çalışır?",
    a: "Kiler sekmesinde mevcut malzemeleri ekle. Tarif önerilerinde 'pişirilebilir' rozeti senin kilerine göre hesaplanır.",
  },
  {
    q: "Haftalık plan ne işe yarar?",
    a: "Hafta sekmesi 7 günlük tarif planı oluşturur. Moda göre (Yoğun / Sağlıklı / Bütçe / Konfor / Çocuklu) öneriler değişir. Tek tek günleri yenileyebilirsin.",
  },
  {
    q: "Tarif önerileri nereden geliyor?",
    a: "Yerel tarif kataloğu + isteğe bağlı OpenAI önerileri. OpenAI anahtarı tanımlı değilse tamamen yerel çalışır.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Supabase üzerinde RLS ile yalnızca senin hane satırların okunabilir. Detay için Profil → Gizlilik.",
  },
];

export default function HelpScreen() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <Screen background="bg" padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={16} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text
            style={{
              fontFamily: fonts.serif,
              fontSize: 22,
              color: colors.ink,
              letterSpacing: -0.4,
            }}
          >
            Yardım
          </Text>
          <Text variant="caption" color={colors.dim}>
            SSS ve destek kanalları
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Sparkles size={16} color={colors.primary} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="smallMedium" weight="600">
              Hoş geldin!
            </Text>
            <Text
              variant="caption"
              color={colors.dim}
              style={{ marginTop: 4, lineHeight: 18 }}
            >
              Aşağıda en sık sorulan sorular var. Cevabını bulamazsan en altta
              bizimle iletişime geçebilirsin.
            </Text>
          </View>
        </View>

        <View style={[styles.card, { marginTop: spacing.lg }]}>
          {FAQ.map((item, i) => (
            <FaqItem
              key={item.q}
              question={item.q}
              answer={item.a}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              border={i > 0}
            />
          ))}
        </View>

        <Text
          variant="overline"
          color={colors.dim}
          style={{
            marginTop: spacing.xl,
            marginBottom: spacing.sm,
            paddingHorizontal: spacing.sm,
          }}
        >
          İletişim
        </Text>
        <View style={styles.card}>
          <ContactRow
            icon={Mail}
            label="E-posta ile yaz"
            sub="destek@swipebite.app"
            onPress={() =>
              Linking.openURL(
                "mailto:destek@swipebite.app?subject=SwipeBite%20destek",
              )
            }
          />
          <ContactRow
            icon={MessageCircle}
            label="Geri bildirim gönder"
            sub="Önerini, hatayı, isteğini paylaş"
            border
            onPress={() =>
              Linking.openURL(
                "mailto:destek@swipebite.app?subject=SwipeBite%20geri%20bildirim",
              )
            }
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const FaqItem: React.FC<{
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
  border?: boolean;
}> = ({ question, answer, open, onToggle, border }) => (
  <View style={[border && { borderTopWidth: 1, borderTopColor: colors.cream }]}>
    <Pressable onPress={onToggle} style={styles.faqHeader}>
      <Text variant="smallMedium" weight="500" style={{ flex: 1 }}>
        {question}
      </Text>
      {open ? (
        <ChevronUp size={16} color={colors.slate} strokeWidth={1.5} />
      ) : (
        <ChevronDown size={16} color={colors.slate} strokeWidth={1.5} />
      )}
    </Pressable>
    {open ? (
      <View style={styles.faqBody}>
        <Text variant="caption" color={colors.dim} style={{ lineHeight: 20 }}>
          {answer}
        </Text>
      </View>
    ) : null}
  </View>
);

const ContactRow: React.FC<{
  icon: LucideIcon;
  label: string;
  sub: string;
  border?: boolean;
  onPress: () => void;
}> = ({ icon: Icon, label, sub, border, onPress }) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.row,
      border && { borderTopWidth: 1, borderTopColor: colors.cream },
    ]}
  >
    <View style={styles.rowIcon}>
      <Icon size={14} color={colors.slate} strokeWidth={1.5} />
    </View>
    <View style={{ flex: 1 }}>
      <Text variant="smallMedium" weight="500">
        {label}
      </Text>
      <Text variant="caption" color={colors.dim} style={{ marginTop: 2 }}>
        {sub}
      </Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  heroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  faqBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
});
