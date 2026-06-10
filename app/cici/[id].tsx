import React from "react";
import {
  Alert,
  Image as RNImage,
  Pressable,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Check,
  Copy,
  Share2,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { findFastFoodItem } from "@/constants/fastfoodItems";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useCiciStore } from "@/store/ciciStore";

export default function CiciSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const session = useCiciStore((state) => state.session);
  const open = useCiciStore((state) => state.open);
  const close = useCiciStore((state) => state.close);
  const startRound = useCiciStore((state) => state.startRound);
  const advanceRound = useCiciStore((state) => state.advanceRound);
  const castVote = useCiciStore((state) => state.castVote);

  React.useEffect(() => {
    if (!id) return;
    open(id);
    return () => close();
  }, [id, open, close]);

  if (!session || !user) {
    return (
      <Screen background="bg">
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text>Yükleniyor…</Text>
        </View>
      </Screen>
    );
  }

  const isCreator = session.createdBy === user.id;

  if (session.status === "lobby") {
    return (
      <LobbyView
        sessionCode={session.code}
        members={session.members}
        deckSize={session.itemIds.length}
        isCreator={isCreator}
        onStart={startRound}
        onClose={() => router.back()}
      />
    );
  }

  if (session.status === "completed") {
    return (
      <WinnerView
        winnerId={session.winnerItemId}
        members={session.members.length}
        onClose={() => router.replace("/(tabs)")}
      />
    );
  }

  return (
    <VotingView
      session={session}
      userId={user.id}
      isCreator={isCreator}
      onVote={async (itemId) => {
        await Haptics.selectionAsync();
        try {
          await castVote(user.id, session.currentRound, itemId);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          Alert.alert("Oy kaydedilemedi", msg);
        }
      }}
      onAdvance={async () => {
        try {
          await advanceRound(session.currentRound);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn("[cici] advance failed", msg);
          // Don't alert here — the timer/everyoneVoted effect will retry
          // on next state change. Surfacing every transient failure would
          // be noisy.
        }
      }}
    />
  );
}

const LobbyView: React.FC<{
  sessionCode: string;
  members: { userId: string; name: string; avatarUrl?: string }[];
  deckSize: number;
  isCreator: boolean;
  onStart: () => Promise<void>;
  onClose: () => void;
}> = ({ sessionCode, members, deckSize, isCreator, onStart, onClose }) => {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `🍔 Cici Boğaz'a katıl! Kod: ${sessionCode}\n\nSwipeBite uygulamasında Cici Boğaz > Kodla Katıl üzerinden giriş yap.`,
      });
    } catch {}
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(sessionCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Screen background="bg" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopBar
        title="Bekleme Odası"
        left={
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.ink} />
          </Pressable>
        }
        right={<View style={{ width: 36 }} />}
      />

      <View style={styles.lobbyBody}>
        <Animated.View entering={FadeInDown.duration(350)}>
          <Text variant="overline" color={colors.dim}>
            Paylaşım Kodu
          </Text>
          <Pressable onPress={handleCopy} style={styles.codeBox}>
            <Text style={styles.codeText}>{sessionCode}</Text>
            <Copy size={20} color={colors.dim} />
          </Pressable>
          <Text variant="caption" color={colors.dim} style={{ marginTop: 6 }}>
            Tıklayarak kopyala
          </Text>
        </Animated.View>

        <View style={{ height: spacing.xl }} />

        <Text variant="overline" color={colors.dim}>
          Katılımcılar ({members.length})
        </Text>
        <View style={styles.membersList}>
          {members.map((member, index) => (
            <Animated.View
              key={member.userId}
              entering={FadeInUp.delay(index * 70).duration(260)}
              style={styles.memberRow}
            >
              <View style={styles.avatar}>
                {member.avatarUrl ? (
                  <ExpoImage
                    source={{ uri: member.avatarUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarLetter}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text variant="bodyMedium" weight="600">
                {member.name}
              </Text>
            </Animated.View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.lobbyFooter}>
          <Text variant="caption" color={colors.dim}>
            {deckSize} ürün arasından seçim yapılacak.
          </Text>
          <Button
            title="Kodu Paylaş"
            variant="outline"
            onPress={handleShare}
            fullWidth
            leftSlot={<Share2 size={16} color={colors.ink} />}
          />
          {isCreator ? (
            <Button
              title={`Oylamayı Başlat (${members.length} kişi)`}
              onPress={onStart}
              fullWidth
            />
          ) : (
            <Text
              variant="caption"
              color={colors.dim}
              style={{ textAlign: "center", marginTop: spacing.sm }}
            >
              Grup sahibinin başlatması bekleniyor…
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
};

const VotingView: React.FC<{
  session: NonNullable<ReturnType<typeof useCiciStore.getState>["session"]>;
  userId: string;
  isCreator: boolean;
  onVote: (itemId: string) => Promise<void>;
  onAdvance: () => Promise<void>;
}> = ({ session, userId, isCreator, onVote, onAdvance }) => {
  const { width } = useWindowDimensions();
  const horizontalPadding = spacing.xl * 2;
  const cardWidth = Math.max(width - horizontalPadding, 280);
  const cardHeight = Math.min(Math.max(Math.round(cardWidth * 0.62), 220), 260);
  const round = session.currentRound;
  const leftId = session.roundLeftId;
  const rightId = session.roundRightId;
  const left = leftId ? findFastFoodItem(leftId) : null;
  const right = rightId ? findFastFoodItem(rightId) : null;

  const myVote = React.useMemo(
    () =>
      session.votes.find(
        (vote) => vote.userId === userId && vote.round === round,
      ) ?? null,
    [round, session.votes, userId],
  );
  const [pendingSelectionId, setPendingSelectionId] = React.useState<
    string | null
  >(null);

  // The countdown timer below re-renders this component ~4×/sec. Memoize the
  // vote tallies so each tick doesn't re-scan session.votes three times
  // (overall count + left card + right card).
  const { votedCount, leftCount, rightCount } = React.useMemo(() => {
    let voted = 0;
    let leftC = 0;
    let rightC = 0;
    for (const vote of session.votes) {
      if (vote.round !== round) continue;
      voted += 1;
      if (vote.itemId === leftId) leftC += 1;
      else if (vote.itemId === rightId) rightC += 1;
    }
    return { votedCount: voted, leftCount: leftC, rightCount: rightC };
  }, [session.votes, round, leftId, rightId]);
  const totalMembers = session.members.length;
  const everyoneVoted = totalMembers > 0 && votedCount >= totalMembers;

  const startedAt = session.roundStartedAt
    ? new Date(session.roundStartedAt).getTime()
    : Date.now();
  const total = session.roundSeconds;
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(intervalId);
  }, []);

  const elapsed = Math.max(0, (now - startedAt) / 1000);
  const remaining = Math.max(0, total - elapsed);
  const timeUp = remaining <= 0;
  const ranOut = timeUp || everyoneVoted;

  const [picking, setPicking] = React.useState(false);

  const advancedRef = React.useRef(false);
  React.useEffect(() => {
    if (advancedRef.current) return;
    if (!leftId || !rightId) return;
    if (!(everyoneVoted || timeUp)) return;
    // Don't advance while a vote is still being written to the server.
    // Otherwise advance_cici_round runs before the vote row exists, sees
    // 0 votes, and picks a random tie-break winner.
    if (picking) return;
    advancedRef.current = true;
    // Everyone voted (or timer hit zero) → advance. Creator goes first,
    // non-creators add jitter so concurrent calls don't all fire at once.
    // The server-side advance_cici_round is now idempotent (early-out when
    // round_left_id is null) so a late second caller is safe.
    const jitter = isCreator ? 0 : 300 + Math.random() * 500;
    const timeoutId = setTimeout(() => {
      // If the call fails (e.g. transient network), allow the next state
      // change to retry by clearing the guard.
      Promise.resolve(onAdvance()).catch(() => {
        advancedRef.current = false;
      });
    }, jitter);
    return () => clearTimeout(timeoutId);
  }, [everyoneVoted, isCreator, leftId, onAdvance, picking, rightId, timeUp]);

  React.useEffect(() => {
    advancedRef.current = false;
    setPendingSelectionId(null);
  }, [round]);

  React.useEffect(() => {
    if (myVote?.itemId) {
      setPendingSelectionId(myVote.itemId);
    }
  }, [myVote?.itemId]);

  const choose = React.useCallback(
    async (itemId: string) => {
      if (picking || ranOut) return;
      setPendingSelectionId(itemId);
      setPicking(true);
      await onVote(itemId);
      setPicking(false);
    },
    [picking, ranOut, onVote],
  );

  const chooseLeft = React.useCallback(
    () => leftId && choose(leftId),
    [leftId, choose],
  );
  const chooseRight = React.useCallback(
    () => rightId && choose(rightId),
    [rightId, choose],
  );

  if (!leftId || !rightId) {
    return (
      <Screen background="bg">
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Animated.View entering={FadeIn} style={styles.waitBadge}>
            <Sparkles size={28} color={colors.primaryDeep} />
          </Animated.View>
          <Text variant="h3" style={{ marginTop: spacing.lg }}>
            Sıradaki tur hazırlanıyor…
          </Text>
        </View>
      </Screen>
    );
  }

  const progress = Math.min(1, elapsed / total);

  return (
    <Screen background="bg" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />

      <TopBar
        title={`Tur ${round}`}
        left={
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.ink} />
          </Pressable>
        }
        right={
          <View style={styles.iconBtn}>
            <Users size={16} color={colors.ink} />
            <Text variant="caption" weight="700" style={{ marginLeft: 4 }}>
              {votedCount}/{totalMembers}
            </Text>
          </View>
        }
      />

      <View style={styles.voteMeta}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(1 - progress) * 100}%`,
                backgroundColor: remaining < 5 ? colors.accent : colors.primary,
              },
            ]}
          />
        </View>
        <Text
          variant="caption"
          weight="700"
          style={{
            color: remaining < 5 ? colors.accent : colors.ink,
            marginTop: 4,
          }}
        >
          {Math.ceil(remaining)}s
        </Text>
        <Text
          variant="overline"
          color={colors.dim}
          style={{ marginTop: spacing.lg }}
        >
          {ranOut
            ? "Sonuç açıklanıyor…"
            : myVote
              ? "Oyun kaydedildi · değiştirebilirsin"
              : "Hangisi?"}
        </Text>
      </View>

      <View style={styles.voteBody}>
        {left ? (
          <View
            style={[
              styles.cardFrame,
              {
                width: cardWidth,
                height: cardHeight,
                minHeight: cardHeight,
                maxHeight: cardHeight,
              },
            ]}
          >
            <VersusCard
              item={left}
              width={cardWidth}
              height={cardHeight}
              onPick={chooseLeft}
              selected={
                myVote?.itemId === left.id || pendingSelectionId === left.id
              }
              voteCount={leftCount}
              showCounts={ranOut}
              disabled={ranOut}
            />
          </View>
        ) : null}

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {right ? (
          <View
            style={[
              styles.cardFrame,
              {
                width: cardWidth,
                height: cardHeight,
                minHeight: cardHeight,
                maxHeight: cardHeight,
              },
            ]}
          >
            <VersusCard
              item={right}
              width={cardWidth}
              height={cardHeight}
              onPick={chooseRight}
              selected={
                myVote?.itemId === right.id || pendingSelectionId === right.id
              }
              voteCount={rightCount}
              showCounts={ranOut}
              disabled={ranOut}
            />
          </View>
        ) : null}
      </View>

      <Text style={styles.voteHint}>
        En çok oy alan sonraki tura geçer · Eşitlikte kura çekilir
      </Text>
    </Screen>
  );
};

const VersusCard: React.FC<{
  item: NonNullable<ReturnType<typeof findFastFoodItem>>;
  width: number;
  height: number;
  onPick: () => void;
  selected?: boolean;
  voteCount?: number;
  showCounts?: boolean;
  disabled?: boolean;
}> = React.memo(
  ({
    item,
    width,
    height,
    onPick,
    selected,
    voteCount = 0,
    showCounts,
    disabled,
  }) => {
    const [imageFailed, setImageFailed] = React.useState(false);
    const imageHeight = height;

    return (
      <Pressable
        onPress={onPick}
        disabled={disabled}
        style={({ pressed }) => [
          styles.card,
          { width, height, minHeight: height, maxHeight: height },
          selected && styles.cardSelected,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={[styles.cardHero, { height: imageHeight }]}>
          <LinearGradient
            colors={["#F4C95D", "#E07A5F", "#6B6560"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {!imageFailed ? (
            <RNImage
              source={{ uri: item.imageUrl }}
              style={[styles.cardHeroImage, { height: imageHeight }]}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : null}
          <View style={styles.cardShade} />
        </View>

        <View style={styles.cardContentOverlayCompact}>
          <View style={styles.cardHeaderRow}>
            {selected ? (
              <View style={styles.selectedPill}>
                <Check size={14} color={colors.bg} strokeWidth={3} />
                <Text
                  variant="caption"
                  weight="700"
                  color={colors.bg}
                  style={{ marginLeft: 4 }}
                >
                  Senin oyun
                </Text>
              </View>
            ) : (
              <View />
            )}
            {showCounts ? (
              <Animated.View entering={FadeIn} style={styles.votePillOverlay}>
                <Text variant="caption" weight="700" color={colors.ink}>
                  {voteCount} oy
                </Text>
              </Animated.View>
            ) : null}
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </Pressable>
    );
  },
);
VersusCard.displayName = "VersusCard";

const WinnerView: React.FC<{
  winnerId?: string;
  members: number;
  onClose: () => void;
}> = ({ winnerId, members, onClose }) => {
  const item = winnerId ? findFastFoodItem(winnerId) : null;

  React.useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <Screen background="bg" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />

      <TopBar
        title="Kazanan"
        left={
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <X size={20} color={colors.ink} />
          </Pressable>
        }
        right={<View style={{ width: 36 }} />}
      />

      <View style={styles.winnerBody}>
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.trophy}
        >
          <Trophy size={36} color={colors.primaryDeep} />
        </Animated.View>

        {item ? (
          <Animated.View
            entering={FadeInUp.delay(180).duration(450)}
            style={styles.winnerCard}
          >
            <ExpoImage
              source={{ uri: item.imageUrl }}
              style={styles.winnerImage}
              contentFit="cover"
            />
            <View style={{ padding: spacing.lg }}>
              <Text style={styles.winnerTitle}>{item.name}</Text>
              <View style={styles.winnerMeta}>
                <Check size={14} color={colors.forest} strokeWidth={2.5} />
                <Text variant="smallMedium" weight="600" color={colors.forest}>
                  {members} kişiden çoğunluk
                </Text>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Text
            variant="body"
            color={colors.dim}
            style={{ textAlign: "center", marginTop: spacing.xl }}
          >
            Hiç beğeni olmadı.
          </Text>
        )}

        <View style={{ flex: 1 }} />
        <Button title="Bitir" onPress={onClose} fullWidth />
      </View>
    </Screen>
  );
};

const TopBar: React.FC<{
  title: string;
  left: React.ReactNode;
  right: React.ReactNode;
}> = ({ title, left, right }) => {
  return (
    <View style={styles.topBar}>
      {left}
      <Text
        variant="overline"
        color={colors.dim}
        style={{ textAlign: "center" }}
      >
        {title}
      </Text>
      {right}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconBtn: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  lobbyBody: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  codeBox: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  codeText: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 4,
    color: colors.ink,
  },
  membersList: {
    marginTop: spacing.sm,
    gap: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
  },
  avatarLetter: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.ink,
  },
  lobbyFooter: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },

  voteMeta: {
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  progressBar: {
    width: 140,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
  },
  voteBody: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  cardFrame: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  card: {
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  cardHero: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  cardHeroImage: {
    width: "100%",
  },
  cardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,23,20,0.28)",
  },
  cardContentOverlayCompact: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: colors.bg,
  },
  votePillOverlay: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.bg,
  },
  selectedPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.forest,
  },
  vsBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  vsText: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.ink,
  },
  voteHint: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    textAlign: "center",
    color: colors.dim,
    fontSize: 13,
    lineHeight: 18,
  },
  waitBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },

  winnerBody: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  trophy: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginTop: spacing.lg,
  },
  winnerCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  winnerImage: {
    width: "100%",
    height: 240,
  },
  winnerTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
  },
  winnerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
