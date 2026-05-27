import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const COLORS = [
  "#FFDB5B",
  "#FFF386",
  "#2BB673",
  "#E5484D",
  "#3B82F6",
  "#7C3AED",
];

interface Piece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  drift: number;
}

const makePieces = (count: number): Piece[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_W,
    delay: Math.random() * 600,
    duration: 1800 + Math.random() * 1600,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#FFDB5B",
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 720 - 360,
    drift: (Math.random() - 0.5) * 120,
  }));

interface Props {
  /** Number of confetti pieces. Default 60. */
  count?: number;
  /** Set false to stop after the initial burst. Default false. */
  loop?: boolean;
}

/**
 * Lightweight confetti — no extra deps. Each piece is a small absolutely
 * positioned View animated with Reanimated on the UI thread.
 */
export const Confetti: React.FC<Props> = ({ count = 60, loop = false }) => {
  const pieces = React.useMemo(() => makePieces(count), [count]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} piece={p} loop={loop} />
      ))}
    </View>
  );
};

const ConfettiPiece: React.FC<{ piece: Piece; loop: boolean }> = ({
  piece,
  loop,
}) => {
  const y = useSharedValue(-30);
  const x = useSharedValue(0);
  const rot = useSharedValue(0);

  React.useEffect(() => {
    const fall = withTiming(SCREEN_H + 40, {
      duration: piece.duration,
      easing: Easing.in(Easing.quad),
    });
    const drift = withTiming(piece.drift, {
      duration: piece.duration,
      easing: Easing.out(Easing.quad),
    });
    const spin = withTiming(piece.rotation, {
      duration: piece.duration,
      easing: Easing.linear,
    });

    y.value = withDelay(piece.delay, loop ? withRepeat(fall, -1, false) : fall);
    x.value = withDelay(
      piece.delay,
      loop ? withRepeat(drift, -1, true) : drift,
    );
    rot.value = withDelay(
      piece.delay,
      loop ? withRepeat(spin, -1, false) : spin,
    );
  }, [piece, loop, y, x, rot]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotateZ: `${rot.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size * 1.6,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    top: 0,
    borderRadius: 2,
  },
});

// Suppress unused warning when withSequence not used here.
void withSequence;
