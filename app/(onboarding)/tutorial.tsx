import React from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  ChevronRight,
  Flame,
  Heart,
  Users,
  UtensilsCrossed,
} from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useTutorialStore } from "@/store/tutorialStore";

const { width: SCREEN_W } = Dimensions.get("window");

type Slide = {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  iconBg: string;
  title: string;
  desc: string;
};

const SLIDES: Slide[] = [
  {
    icon: Flame,
    iconBg: colors.primary,
    title: "Tinder gibi, ama yemek için",
    desc: "Kartları kaydır: sağa beğen, sola geç. AI senin damak tadını öğrenir, daha iyi öneriler getirir.",
  },
  {
    icon: Heart,
    iconBg: colors.accent,
    title: "Aileyle eşleşin",
    desc: "Ev halkını davet et. Aynı tarifi beğendiğinizde otomatik eşleşme — bugünün yemeği belli.",
  },
  {
    icon: UtensilsCrossed,
    iconBg: colors.primaryDeep,
    title: "Birlikte pişirin",
    desc: "Adım adım rehberli pişirme modu. Mutfakta tek tablet, tüm aile aynı sayfada.",
  },
  {
    icon: Users,
    iconBg: colors.accent,
    title: "Hadi başlayalım",
    desc: "Önce birkaç kart kaydır, sonra eşini davet et. 'Bugün ne yesek?' artık tartışma değil.",
  },
];

export default function TutorialScreen() {
  const markSeen = useTutorialStore((s) => s.markSeen);
  const scrollRef = React.useRef<ScrollView>(null);
  const [index, setIndex] = React.useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / SCREEN_W);
    if (i !== index) setIndex(i);
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_W, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    markSeen("welcomeCarousel");
    router.replace("/(tabs)");
  };

  return (
    <Screen background="bg" padded={false}>
      <View style={styles.skipRow}>
        <Pressable onPress={handleFinish} hitSlop={10}>
          <Text variant="bodyMedium" color={colors.slate}>
            Geç
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          return (
            <View key={i} style={[styles.slide, { width: SCREEN_W }]}>
              <Animated.View
                entering={FadeIn.duration(400)}
                style={[styles.iconCircle, { backgroundColor: slide.iconBg }]}
              >
                <Icon size={48} strokeWidth={2} color={colors.ink} />
              </Animated.View>
              <Text variant="h1" align="center" style={styles.title}>
                {slide.title}
              </Text>
              <Text
                variant="body"
                color={colors.slate}
                align="center"
                style={styles.desc}
              >
                {slide.desc}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <ProgressDots total={SLIDES.length} index={index} />
        <Pressable onPress={handleNext} style={styles.cta}>
          <Text variant="bodyMedium" weight="700" color={colors.ink}>
            {index === SLIDES.length - 1 ? "Hadi başlayalım" : "İleri"}
          </Text>
          <ChevronRight size={18} strokeWidth={2.5} color={colors.ink} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    maxWidth: 320,
  },
  desc: {
    maxWidth: 340,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
    gap: spacing.lg,
    alignItems: "center",
  },
  cta: {
    alignSelf: "stretch",
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
