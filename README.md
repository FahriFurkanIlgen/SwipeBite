# SwipeBite

> Birlikte karar verin. Hızlıca pişirin.
> _A collaborative AI meal decision app for Turkish households._

SwipeBite is a Tinder-style household meal decision platform. Users swipe Turkish family recipes, the system finds the best match across the household, and AI handles pantry parsing, weekly planning, and recipe adaptation.

This repo is a production-quality **MVP scaffold** built with **React Native + Expo + TypeScript + Expo Router**, using **Zustand**, **TanStack Query**, **Supabase**, and the **OpenAI API**.

---

## Stack

| Layer        | Choice                                 |
| ------------ | -------------------------------------- |
| App runtime  | React Native + Expo (managed)          |
| Language     | TypeScript (strict)                    |
| Routing      | Expo Router (typed)                    |
| Styling      | NativeWind 4 + token-driven `theme.ts` |
| Client state | Zustand                                |
| Server state | TanStack Query                         |
| Backend      | Supabase (Postgres + Auth + Storage)   |
| AI           | OpenAI Chat Completions (JSON mode)    |
| Animations   | Reanimated 3 + Gesture Handler         |
| Icons        | `@expo/vector-icons`                   |

The app **runs without a backend out of the box**: when Supabase / OpenAI env vars are missing, services automatically fall back to deterministic mock implementations so the demo flows work end-to-end.

---

## Quick start

```pwsh
# 1. Install
npm install

# 2. (Optional) Add real keys
copy .env.example .env
#   set EXPO_PUBLIC_SUPABASE_URL, _ANON_KEY, _OPENAI_API_KEY

# 3. Run
npm run start
```

> SECURITY: never ship the raw OpenAI key inside a public mobile build. Proxy through a Supabase Edge Function (or your own backend) before production. The `openai.ts` client is for prototyping only.

---

## Architecture

Feature-based, with strict separation between UI, state, and AI logic.

```
app/                       # Expo Router routes
  (auth)/welcome.tsx
  (onboarding)/{preferences,household,invite,finish}.tsx
  (tabs)/{index,swipe,planner,pantry,profile}.tsx
  session/[id].tsx         # swipe session
  match/[id].tsx           # match result
  recipe/[id].tsx          # recipe detail
  import.tsx               # Instagram import (modal)

src/
  components/
    ui/                    # Button, Card, Input, Pill, Screen, Text, ProgressDots
    ai/AISuggestionBubble.tsx
  features/
    ai/
      pantryParser.ts          # text → structured pantry items
      recommendationEngine.ts  # household-aware scoring
      matchEngine.ts           # vote aggregation + winner selection
      weeklyPlanner.ts         # 7-day plan generator
      recipeAdapter.ts         # per-user recipe adaptation
    swipe/
      RecipeCard.tsx           # gesture-driven card
      SwipeActions.tsx
  store/                    # Zustand stores
  lib/                      # env, supabase, openai clients
  constants/                # theme, copy (Turkish), mock recipes
  types/domain.ts           # shared domain types
  utils/                    # id, format helpers
```

---

## Core flows (all wired)

1. **Welcome / Auth** — mock sign-in (email / Google / Apple). Hook real auth in `src/lib/supabase.ts` + `authStore.signInMock`.
2. **Onboarding** — 4 steps: allergies + dislikes + spice + cuisines → household name → invite (link / QR / later) → start session.
3. **Home** — greeting, primary CTA "Yemek eşleşmesi başlat", active session card, quick actions, AI suggestion bubbles.
4. **Swipe Session** — stack of 8 recipe cards; gesture-driven (left/right/up/down) with badges, action buttons, haptics. Real-time recommendation score per card.
5. **Match Result** — winning recipe, "why matched" reasons, 3 alternatives (faster / lighter / cheaper), CTA to cook.
6. **Weekly Planner** — pick mode (busy / healthy / budget / comfort / kids), AI generates 7 dinners + grocery list, "regenerate this day" button.
7. **Pantry** — text-based input → AI parser → editable chips → "Bunlarla ne yapsam?" launches a new pantry-aware session.
8. **Recipe Detail** — hero image, ingredients, steps, missing ingredients warning, "AI bana göre uyarla".
9. **Instagram Import** — paste link / caption (screenshot placeholder).

---

## AI systems

All AI modules follow the same contract: **call OpenAI when key is present, return deterministic fallbacks when not**. The recommendation scoring is fully local and testable.

### Pantry parser

Input: free-form Turkish text (`"tavuk yoğurt patates yumurta"`).
Output: deduped `PantryItem[]`. AI used to categorize; fallback uses tokenizer + stopword filter.

### Recommendation scoring

```
ALLERGY        = hard reject
LIKE           = +1
SUPERLIKE      = +3
DISLIKE        = -1
SUPERDISLIKE   = -5
PANTRY_MATCH   = +2 × overlap%
NOT_RECENTLY   = +1
TIME_MATCH     = +1
CUISINE_LOVE   = +1.5 per household member
```

Produces `AIRecommendation[]` sorted by score, each with explanation + pantry % + household compatibility %.

### Match engine

Aggregates session votes per recipe, picks the highest agreement score, generates human-readable reasons, and emits 3 alternatives.

### Weekly planner

Mode-weighted picker over the recipe pool (busy → prep ≤ 25 dk, healthy → zeytinyağlı/vejetaryen, etc.) with ingredient-reuse grocery list.

### Recipe adapter

AI rewrites notes + substitutions based on allergies, dislikes, and pantry. Fallback flags missing ingredients.

---

## Design system

Derived from the Bumble reference (`DESIGN.md`): warm yellow canvas (`#FFDB5B`), charcoal ink (`#202020`), generous rounding, soft shadows, large touch targets. Tokens live in `src/constants/theme.ts` and mirror Tailwind tokens in `tailwind.config.js`.

Tone of copy is in `src/constants/copy.ts` — natural conversational Turkish (e.g. _"Bugün ne yesek?"_, _"Eşinin oyu bekleniyor"_, _"Evdeki malzemelerle öner"_).

---

## Next milestones

- Wire real Supabase auth + RLS-protected tables (schemas already documented in `SwipeBite.md`).
- Move OpenAI calls behind Supabase Edge Functions.
- Realtime household session sync via Supabase Realtime.
- Expo Notifications for "Eşinin oyu bekleniyor".
- Recipe persistence + saved recipes view.
- Instagram parser (caption → recipe via OpenAI).

---

## Folder cheatsheet

- New screen → `app/...`
- New feature logic → `src/features/<name>/`
- New global state → `src/store/`
- New API call → `src/services/` (add as you wire Supabase)
- New shared UI primitive → `src/components/ui/`
- New copy string → `src/constants/copy.ts` (Turkish only)
