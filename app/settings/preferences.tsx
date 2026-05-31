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
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react-native";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import {
  DEFAULT_PREFERENCES,
  HouseholdPreferences,
  Season,
  ShoppingChannel,
  WeekDay,
} from "@/types/domain";

const DAY_LABEL: Record<WeekDay, string> = {
  mon: "Pzt",
  tue: "Sal",
  wed: "Çar",
  thu: "Per",
  fri: "Cum",
  sat: "Cmt",
  sun: "Paz",
};
const DAYS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const STEPS = [
  "Aile",
  "Alerji",
  "Kapsam",
  "Zaman",
  "Protein",
  "Damak",
  "Eşleştirme",
  "Mevsim",
  "Alışveriş",
  "Dil",
];

export default function PreferencesWizard() {
  const household = useAuthStore((s) => s.household);
  const stored = usePreferencesStore((s) => s.prefs);
  const save = usePreferencesStore((s) => s.save);

  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<HouseholdPreferences>(
    stored ?? DEFAULT_PREFERENCES,
  );

  React.useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const update = <K extends keyof HouseholdPreferences>(
    key: K,
    value: HouseholdPreferences[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const next = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    if (!household) {
      Alert.alert("Hata", "Önce bir hane oluştur.");
      return;
    }
    try {
      await save(household.id, draft);
      Alert.alert(
        "Kaydedildi",
        "Tercihlerin güncellendi. Planner'dan 'Yeni hafta planı' ile dene.",
        [{ text: "Tamam", onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Kaydedilemedi");
    }
  };

  const back = () => {
    if (step === 0) router.back();
    else setStep(step - 1);
  };

  return (
    <Screen background="bg" padded={false}>
      <Stack.Screen options={{ title: "Aile Tercihleri" }} />
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10}>
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Text variant="overline" color={colors.dim}>
          {step + 1} / {STEPS.length} · {STEPS[step]}
        </Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            { width: `${((step + 1) / STEPS.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 ? (
          <StepFamily draft={draft} update={update} />
        ) : step === 1 ? (
          <StepAllergies draft={draft} update={update} />
        ) : step === 2 ? (
          <StepScope draft={draft} update={update} />
        ) : step === 3 ? (
          <StepTime draft={draft} update={update} />
        ) : step === 4 ? (
          <StepProtein draft={draft} update={update} />
        ) : step === 5 ? (
          <StepTastes draft={draft} update={update} />
        ) : step === 6 ? (
          <StepPairing draft={draft} update={update} />
        ) : step === 7 ? (
          <StepSeason draft={draft} update={update} />
        ) : step === 8 ? (
          <StepShopping draft={draft} update={update} />
        ) : (
          <StepLanguage draft={draft} update={update} />
        )}
        <View style={{ height: spacing["3xl"] }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={next} style={styles.cta}>
          <Text variant="bodyMedium" weight="700" color={colors.ink}>
            {step === STEPS.length - 1 ? "Kaydet" : "Devam"}
          </Text>
          <ChevronRight size={18} strokeWidth={2.5} color={colors.ink} />
        </Pressable>
      </View>
    </Screen>
  );
}

// ---------- Step components ----------

type StepProps = {
  draft: HouseholdPreferences;
  update: <K extends keyof HouseholdPreferences>(
    k: K,
    v: HouseholdPreferences[K],
  ) => void;
};

function StepFamily({ draft, update }: StepProps) {
  const f = draft.family;
  return (
    <>
      <Title>Aile</Title>
      <Hint>Kaç kişisiniz, çocuk var mı?</Hint>
      <NumberRow
        label="Yetişkin sayısı"
        value={f.adults}
        onChange={(adults) => update("family", { ...f, adults })}
        min={1}
        max={10}
      />
      <Label>Çocuklar</Label>
      {f.children.map((c, i) => (
        <View key={i} style={styles.row}>
          <Text variant="smallMedium" style={{ flex: 1 }}>
            Yaş {c.age}
            {c.picky ? " · seçici" : ""}
          </Text>
          <Pressable
            onPress={() =>
              update("family", {
                ...f,
                children: f.children.map((x, idx) =>
                  idx === i ? { ...x, picky: !x.picky } : x,
                ),
              })
            }
            style={[
              styles.smallPill,
              {
                backgroundColor: c.picky ? colors.accentSoft : colors.cream,
                borderColor: c.picky ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              variant="caption"
              color={c.picky ? colors.accent : colors.slate}
            >
              Seçici
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              update("family", {
                ...f,
                children: f.children.filter((_, idx) => idx !== i),
              })
            }
            hitSlop={8}
          >
            <X size={16} color={colors.slate} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() =>
          update("family", {
            ...f,
            children: [...f.children, { age: 5, picky: false }],
          })
        }
        style={styles.addRow}
      >
        <Plus size={14} color={colors.slate} />
        <Text variant="smallMedium" color={colors.slate}>
          Çocuk ekle
        </Text>
      </Pressable>
      {f.children.length > 0 ? (
        <NumberRow
          label="Son eklenen çocuğun yaşı"
          value={f.children[f.children.length - 1]!.age}
          onChange={(age) =>
            update("family", {
              ...f,
              children: f.children.map((c, i) =>
                i === f.children.length - 1 ? { ...c, age } : c,
              ),
            })
          }
          min={0}
          max={18}
        />
      ) : null}
      <Label>Misafir sıklığı</Label>
      <SegmentRow
        options={[
          { value: "asla", label: "Asla" },
          { value: "nadiren", label: "Nadiren" },
          { value: "sik", label: "Sık" },
        ]}
        value={f.guestsFrequency}
        onChange={(guestsFrequency) =>
          update("family", {
            ...f,
            guestsFrequency: guestsFrequency as typeof f.guestsFrequency,
          })
        }
      />
    </>
  );
}

function StepAllergies({ draft, update }: StepProps) {
  const a = draft.allergies;
  return (
    <>
      <Title>Alerji & Diyet</Title>
      <Hint>Kritik — bu öğeler asla plana eklenmez.</Hint>
      <Label>Tıbbi alerjiler</Label>
      <TagInput
        items={a.allergies}
        placeholder="örn. fıstık, deniz ürünü"
        onChange={(allergies) => update("allergies", { ...a, allergies })}
        accent
      />
      <Label>Diyet kuralları</Label>
      <ChipMulti
        options={[
          "vejetaryen",
          "vegan",
          "glutensiz",
          "laktozsuz",
          "helal",
          "düşük karbonhidrat",
          "yüksek protein",
        ]}
        selected={a.dietaryRules}
        onChange={(dietaryRules) => update("allergies", { ...a, dietaryRules })}
      />
      <Label>Tercihen asla yemiyoruz</Label>
      <TagInput
        items={a.neverEat}
        placeholder="örn. karaciğer, bamya"
        onChange={(neverEat) => update("allergies", { ...a, neverEat })}
      />
    </>
  );
}

function StepScope({ draft, update }: StepProps) {
  const s = draft.scope;
  return (
    <>
      <Title>Kapsam</Title>
      <Hint>Hangi günler ve günde kaç öğün planlansın?</Hint>
      <Label>Planlanacak günler</Label>
      <DayPicker
        selected={s.days}
        onChange={(days) => update("scope", { ...s, days })}
      />
      <NumberRow
        label="Günde kaç öğün"
        value={s.mealsPerDay}
        onChange={(mealsPerDay) => update("scope", { ...s, mealsPerDay })}
        min={1}
        max={3}
      />
      <ToggleRow
        label="Hafta sonu farklı plan"
        value={s.weekendDifferent}
        onChange={(weekendDifferent) =>
          update("scope", { ...s, weekendDifferent })
        }
      />
    </>
  );
}

function StepTime({ draft, update }: StepProps) {
  const tm = draft.time;
  return (
    <>
      <Title>Zaman</Title>
      <Hint>Pişirmeye ne kadar vaktin var?</Hint>
      <NumberRow
        label="Maks pişirme süresi (dk)"
        value={tm.maxCookMinutes}
        onChange={(maxCookMinutes) => update("time", { ...tm, maxCookMinutes })}
        min={15}
        max={180}
        step={5}
      />
      <Label>Hızlı günler (≤25 dk)</Label>
      <DayPicker
        selected={tm.quickDays}
        onChange={(quickDays) => update("time", { ...tm, quickDays })}
      />
      <Label>Uzun pişirme günleri</Label>
      <DayPicker
        selected={tm.longDays}
        onChange={(longDays) => update("time", { ...tm, longDays })}
      />
      <ToggleRow
        label="Meal prep (tek seferde haftaya hazırlık)"
        value={tm.mealPrep}
        onChange={(mealPrep) => update("time", { ...tm, mealPrep })}
      />
    </>
  );
}

function StepProtein({ draft, update }: StepProps) {
  const p = draft.protein;
  return (
    <>
      <Title>Protein</Title>
      <Hint>Haftada protein dağılımı.</Hint>
      <NumberRow
        label="Kırmızı et (gün/hafta)"
        value={p.redMeatPerWeek}
        onChange={(redMeatPerWeek) =>
          update("protein", { ...p, redMeatPerWeek })
        }
        min={0}
        max={7}
      />
      <NumberRow
        label="Balık (gün/hafta)"
        value={p.fishPerWeek}
        onChange={(fishPerWeek) => update("protein", { ...p, fishPerWeek })}
        min={0}
        max={7}
      />
      <Label>Tercih edilen balıklar</Label>
      <TagInput
        items={p.fishTypes}
        placeholder="örn. somon, hamsi"
        onChange={(fishTypes) => update("protein", { ...p, fishTypes })}
      />
      <NumberRow
        label="Tavuk / hindi (gün/hafta)"
        value={p.poultryPerWeek}
        onChange={(poultryPerWeek) =>
          update("protein", { ...p, poultryPerWeek })
        }
        min={0}
        max={7}
      />
      <NumberRow
        label="Baklagil (gün/hafta)"
        value={p.legumesPerWeek}
        onChange={(legumesPerWeek) =>
          update("protein", { ...p, legumesPerWeek })
        }
        min={0}
        max={7}
      />
      <Label>Sabit günler (ör. Cuma = balık)</Label>
      {p.fixedDays.map((fd, i) => (
        <View key={i} style={styles.row}>
          <Text variant="smallMedium" style={{ flex: 1 }}>
            {DAY_LABEL[fd.day]} → {fd.protein}
          </Text>
          <Pressable
            onPress={() =>
              update("protein", {
                ...p,
                fixedDays: p.fixedDays.filter((_, idx) => idx !== i),
              })
            }
            hitSlop={8}
          >
            <X size={16} color={colors.slate} />
          </Pressable>
        </View>
      ))}
      <AddFixedDay
        onAdd={(fd) =>
          update("protein", { ...p, fixedDays: [...p.fixedDays, fd] })
        }
      />
    </>
  );
}

function StepTastes({ draft, update }: StepProps) {
  const tt = draft.tastes;
  return (
    <>
      <Title>Damak</Title>
      <Hint>Sevdiğiniz ve sevmediğiniz yemekler.</Hint>
      <Label>Sevdiğimiz (10-15 yemek)</Label>
      <TagInput
        items={tt.lovedDishes}
        placeholder="örn. mantı, mercimek çorbası"
        onChange={(lovedDishes) => update("tastes", { ...tt, lovedDishes })}
      />
      <Label>Sevmediğimiz</Label>
      <TagInput
        items={tt.dislikedDishes}
        placeholder="örn. brokoli, kereviz"
        onChange={(dislikedDishes) =>
          update("tastes", { ...tt, dislikedDishes })
        }
        accent
      />
      <NumberRow
        label="Haftada yeni tarif sayısı"
        value={tt.newRecipesPerWeek}
        onChange={(newRecipesPerWeek) =>
          update("tastes", { ...tt, newRecipesPerWeek })
        }
        min={0}
        max={7}
      />
    </>
  );
}

function StepPairing({ draft, update }: StepProps) {
  const pr = draft.pairing;
  return (
    <>
      <Title>Eşleştirme Kuralları</Title>
      <Hint>Yan yemekler ve yapılmayacak eşleşmeler.</Hint>
      <Label>Sık tüketilen yan yemekler</Label>
      <TagInput
        items={pr.sides}
        placeholder="örn. pilav, salata, cacık"
        onChange={(sides) => update("pairing", { ...pr, sides })}
      />
      <Label>Yapılmayacak eşleşmeler (ana + yan)</Label>
      {pr.forbiddenPairs.map((fp, i) => (
        <View key={i} style={styles.row}>
          <Text variant="smallMedium" style={{ flex: 1 }}>
            {fp.main} ✕ {fp.side}
            {fp.reason ? ` — ${fp.reason}` : ""}
          </Text>
          <Pressable
            onPress={() =>
              update("pairing", {
                ...pr,
                forbiddenPairs: pr.forbiddenPairs.filter((_, idx) => idx !== i),
              })
            }
            hitSlop={8}
          >
            <X size={16} color={colors.slate} />
          </Pressable>
        </View>
      ))}
      <AddPair
        onAdd={(fp) =>
          update("pairing", {
            ...pr,
            forbiddenPairs: [...pr.forbiddenPairs, fp],
          })
        }
      />
      <Label>Günden güne taşıma (ör. tavuk → tavuklu çorba)</Label>
      {pr.dayCarryover.map((c, i) => (
        <View key={i} style={styles.row}>
          <Text variant="smallMedium" style={{ flex: 1 }}>
            {c.from} → {c.to}
          </Text>
          <Pressable
            onPress={() =>
              update("pairing", {
                ...pr,
                dayCarryover: pr.dayCarryover.filter((_, idx) => idx !== i),
              })
            }
            hitSlop={8}
          >
            <X size={16} color={colors.slate} />
          </Pressable>
        </View>
      ))}
      <AddCarryover
        onAdd={(c) =>
          update("pairing", {
            ...pr,
            dayCarryover: [...pr.dayCarryover, c],
          })
        }
      />
      <Label>Sadece yan sayılanlar (ana olarak kullanma)</Label>
      <TagInput
        items={pr.sidesOnly}
        placeholder="örn. yoğurt, turşu"
        onChange={(sidesOnly) => update("pairing", { ...pr, sidesOnly })}
      />
    </>
  );
}

function StepSeason({ draft, update }: StepProps) {
  const s = draft.season;
  return (
    <>
      <Title>Mevsim</Title>
      <Hint>Yıl boyu mu, mevsimine göre mi?</Hint>
      <ToggleRow
        label="Yıl boyu (mevsim önemsiz)"
        value={s.yearRound}
        onChange={(yearRound) => update("season", { ...s, yearRound })}
      />
      {!s.yearRound ? (
        <>
          <Label>Şu anki mevsim</Label>
          <SegmentRow
            options={[
              { value: "ilkbahar", label: "İlkbahar" },
              { value: "yaz", label: "Yaz" },
              { value: "sonbahar", label: "Sonbahar" },
              { value: "kis", label: "Kış" },
            ]}
            value={s.currentSeason}
            onChange={(currentSeason) =>
              update("season", {
                ...s,
                currentSeason: currentSeason as Season,
              })
            }
          />
        </>
      ) : null}
    </>
  );
}

function StepShopping({ draft, update }: StepProps) {
  const sh = draft.shopping;
  return (
    <>
      <Title>Alışveriş</Title>
      <Hint>Listeyi nasıl alıyorsun?</Hint>
      <Label>Alışveriş günü</Label>
      <DayPicker
        selected={[sh.day]}
        single
        onChange={(days) =>
          update("shopping", { ...sh, day: days[0] ?? sh.day })
        }
      />
      <Label>Kanal</Label>
      <SegmentRow
        options={[
          { value: "market", label: "Market" },
          { value: "online", label: "Online" },
          { value: "ikisi", label: "İkisi" },
        ]}
        value={sh.channel}
        onChange={(channel) =>
          update("shopping", { ...sh, channel: channel as ShoppingChannel })
        }
      />
      <ToggleRow
        label="Listeyi kategoriye göre grupla"
        value={sh.groupByCategory}
        onChange={(groupByCategory) =>
          update("shopping", { ...sh, groupByCategory })
        }
      />
      <Label>Dolapta sürekli olanlar</Label>
      <TagInput
        items={sh.stocked}
        placeholder="örn. zeytinyağı, tuz, makarna"
        onChange={(stocked) => update("shopping", { ...sh, stocked })}
      />
    </>
  );
}

function StepLanguage({ draft, update }: StepProps) {
  return (
    <>
      <Title>Dil</Title>
      <Hint>Plan ve tarifler hangi dilde olsun?</Hint>
      <SegmentRow
        options={[
          { value: "tr", label: "Türkçe" },
          { value: "en", label: "English" },
        ]}
        value={draft.language}
        onChange={(language) =>
          update("language", language as HouseholdPreferences["language"])
        }
      />
    </>
  );
}

// ---------- Building blocks ----------

const Title = ({ children }: { children: React.ReactNode }) => (
  <Text variant="h1" style={{ marginBottom: 4 }}>
    {children}
  </Text>
);
const Hint = ({ children }: { children: React.ReactNode }) => (
  <Text
    variant="smallMedium"
    color={colors.slate}
    style={{ marginBottom: spacing.lg }}
  >
    {children}
  </Text>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <Text
    variant="overline"
    color={colors.dim}
    style={{ marginTop: spacing.md, marginBottom: 6 }}
  >
    {children}
  </Text>
);

function NumberRow({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <View style={styles.numRow}>
      <Text variant="smallMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        style={styles.numBtn}
        hitSlop={6}
      >
        <Text variant="bodyMedium" weight="700">
          −
        </Text>
      </Pressable>
      <Text
        variant="bodyMedium"
        weight="700"
        style={{ minWidth: 32, textAlign: "center" }}
      >
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        style={styles.numBtn}
        hitSlop={6}
      >
        <Text variant="bodyMedium" weight="700">
          +
        </Text>
      </Pressable>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[
        styles.numRow,
        {
          backgroundColor: value ? colors.accentSoft : colors.cream,
          borderColor: value ? colors.accent : colors.border,
        },
      ]}
    >
      <Text variant="smallMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text
        variant="smallMedium"
        weight="600"
        color={value ? colors.accent : colors.dim}
      >
        {value ? "Açık" : "Kapalı"}
      </Text>
    </Pressable>
  );
}

function SegmentRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.segRow}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.segItem,
              {
                backgroundColor: active ? colors.ink : colors.cream,
                borderColor: active ? colors.ink : colors.border,
              },
            ]}
          >
            <Text
              variant="smallMedium"
              weight={active ? "600" : "400"}
              color={active ? colors.bg : colors.slate}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DayPicker({
  selected,
  onChange,
  single,
}: {
  selected: WeekDay[];
  onChange: (next: WeekDay[]) => void;
  single?: boolean;
}) {
  return (
    <View style={styles.dayRow}>
      {DAYS.map((d) => {
        const active = selected.includes(d);
        return (
          <Pressable
            key={d}
            onPress={() => {
              if (single) onChange([d]);
              else
                onChange(
                  active ? selected.filter((x) => x !== d) : [...selected, d],
                );
            }}
            style={[
              styles.dayPill,
              {
                backgroundColor: active ? colors.ink : colors.cream,
                borderColor: active ? colors.ink : colors.border,
              },
            ]}
          >
            <Text
              variant="caption"
              weight={active ? "700" : "400"}
              color={active ? colors.bg : colors.slate}
            >
              {DAY_LABEL[d]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ChipMulti({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <Pressable
            key={o}
            onPress={() =>
              onChange(
                active ? selected.filter((s) => s !== o) : [...selected, o],
              )
            }
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.ink : colors.cream,
                borderColor: active ? colors.ink : colors.border,
              },
            ]}
          >
            <Text
              variant="smallMedium"
              weight={active ? "600" : "400"}
              color={active ? colors.bg : colors.slate}
            >
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TagInput({
  items,
  placeholder,
  onChange,
  accent,
}: {
  items: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
  accent?: boolean;
}) {
  const [text, setText] = React.useState("");
  const add = () => {
    const parts = text
      .split(",")
      .map((s) => s.trim().toLocaleLowerCase("tr-TR"))
      .filter((s) => s.length > 0 && !items.includes(s));
    if (parts.length === 0) return;
    onChange([...items, ...parts]);
    setText("");
  };
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.tagInputRow}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.dim}
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          returnKeyType="done"
          blurOnSubmit={false}
          style={styles.tagInput}
        />
        <Pressable
          onPress={add}
          disabled={!text.trim()}
          style={[styles.addBtn, { opacity: text.trim() ? 1 : 0.4 }]}
          hitSlop={6}
        >
          <Plus size={16} color={colors.bg} strokeWidth={2.5} />
        </Pressable>
      </View>
      {items.length > 0 ? (
        <View style={styles.chipWrap}>
          {items.map((it) => (
            <View
              key={it}
              style={[
                styles.tagChip,
                {
                  backgroundColor: accent ? colors.accentSoft : colors.cream,
                  borderColor: accent ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                variant="smallMedium"
                color={accent ? colors.accent : colors.slate}
              >
                {it}
              </Text>
              <Pressable
                onPress={() => onChange(items.filter((x) => x !== it))}
                hitSlop={6}
              >
                <X
                  size={11}
                  color={accent ? colors.accent : colors.slate}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AddFixedDay({
  onAdd,
}: {
  onAdd: (fd: { day: WeekDay; protein: string }) => void;
}) {
  const [day, setDay] = React.useState<WeekDay>("fri");
  const [protein, setProtein] = React.useState("");
  return (
    <View style={styles.addCard}>
      <DayPicker
        selected={[day]}
        single
        onChange={(d) => setDay(d[0] ?? day)}
      />
      <View style={styles.tagInputRow}>
        <TextInput
          placeholder="örn. balık"
          placeholderTextColor={colors.dim}
          value={protein}
          onChangeText={setProtein}
          style={styles.tagInput}
        />
        <Pressable
          onPress={() => {
            if (!protein.trim()) return;
            onAdd({ day, protein: protein.trim() });
            setProtein("");
          }}
          style={[styles.addBtn, { opacity: protein.trim() ? 1 : 0.4 }]}
          hitSlop={6}
        >
          <Plus size={16} color={colors.bg} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

function AddPair({
  onAdd,
}: {
  onAdd: (fp: { main: string; side: string; reason?: string }) => void;
}) {
  const [main, setMain] = React.useState("");
  const [side, setSide] = React.useState("");
  return (
    <View style={styles.addCard}>
      <View style={styles.tagInputRow}>
        <TextInput
          placeholder="ana (örn. balık)"
          placeholderTextColor={colors.dim}
          value={main}
          onChangeText={setMain}
          style={[styles.tagInput, { flex: 1 }]}
        />
        <TextInput
          placeholder="yan (örn. cacık)"
          placeholderTextColor={colors.dim}
          value={side}
          onChangeText={setSide}
          style={[styles.tagInput, { flex: 1, marginLeft: 6 }]}
        />
        <Pressable
          onPress={() => {
            if (!main.trim() || !side.trim()) return;
            onAdd({ main: main.trim(), side: side.trim() });
            setMain("");
            setSide("");
          }}
          style={[
            styles.addBtn,
            { opacity: main.trim() && side.trim() ? 1 : 0.4, marginLeft: 6 },
          ]}
          hitSlop={6}
        >
          <Plus size={16} color={colors.bg} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

function AddCarryover({
  onAdd,
}: {
  onAdd: (c: { from: string; to: string }) => void;
}) {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  return (
    <View style={styles.addCard}>
      <View style={styles.tagInputRow}>
        <TextInput
          placeholder="kalan (örn. tavuk)"
          placeholderTextColor={colors.dim}
          value={from}
          onChangeText={setFrom}
          style={[styles.tagInput, { flex: 1 }]}
        />
        <TextInput
          placeholder="dönüşür (örn. çorba)"
          placeholderTextColor={colors.dim}
          value={to}
          onChangeText={setTo}
          style={[styles.tagInput, { flex: 1, marginLeft: 6 }]}
        />
        <Pressable
          onPress={() => {
            if (!from.trim() || !to.trim()) return;
            onAdd({ from: from.trim(), to: to.trim() });
            setFrom("");
            setTo("");
          }}
          style={[
            styles.addBtn,
            { opacity: from.trim() && to.trim() ? 1 : 0.4, marginLeft: 6 },
          ]}
          hitSlop={6}
        >
          <Plus size={16} color={colors.bg} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    paddingBottom: spacing.sm,
  },
  progressTrack: {
    marginHorizontal: spacing.xl,
    height: 3,
    backgroundColor: colors.hairline,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: colors.primary },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  cta: {
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  numRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  numBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: "dashed",
    marginTop: 6,
    marginBottom: 6,
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  segRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  segItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  dayRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayPill: {
    width: 42,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  tagInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.cream,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  addCard: {
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: "dashed",
  },
});
