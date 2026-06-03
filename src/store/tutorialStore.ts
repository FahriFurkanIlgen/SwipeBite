import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "swipebite.tutorial.v1";

export type TutorialKey =
  | "welcomeCarousel"
  | "swipeCoach"
  | "plannerCoach"
  | "pantryCoach"
  | "inviteCoach";

type SeenMap = Record<TutorialKey, boolean>;

const defaultSeen: SeenMap = {
  welcomeCarousel: false,
  swipeCoach: false,
  plannerCoach: false,
  pantryCoach: false,
  inviteCoach: false,
};

interface TutorialState {
  seen: SeenMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  markSeen: (key: TutorialKey) => void;
  skipAll: () => void;
  resetAll: () => Promise<void>;
}

async function persist(seen: SeenMap) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // best effort
  }
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  seen: defaultSeen,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SeenMap>;
        set({ seen: { ...defaultSeen, ...parsed }, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },
  markSeen: (key) => {
    const next = { ...get().seen, [key]: true };
    set({ seen: next });
    void persist(next);
  },
  skipAll: () => {
    const next = (Object.keys(defaultSeen) as TutorialKey[]).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as SeenMap,
    );
    set({ seen: next });
    void persist(next);
  },
  resetAll: async () => {
    set({ seen: { ...defaultSeen } });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // best effort
    }
  },
}));
