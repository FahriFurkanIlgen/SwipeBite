# AI Meal Match App — Master Product & Technical Blueprint

# Vision

A collaborative AI-powered meal decision platform where couples and households decide what to eat together through swipe-based matching, personalized recommendations, and intelligent weekly planning.

Core idea:

> Reduce the mental load of deciding what to eat every day.

The application combines:

- Tinder-like swipe mechanics
- AI-powered personalization
- Household collaboration
- Pantry-aware recommendations
- Weekly planning
- Instagram recipe imports
- Behavioral learning

---

# Product Positioning

## Core Positioning

Front-facing experience:
- Fun
- Fast
- Swipe-driven
- Collaborative

Behind the scenes:
- AI recommendation engine
- Preference learning
- Household optimization
- Meal planning intelligence

This is NOT a recipe app.

This is:

> A household meal decision assistant.

---

# Target Audience

## Primary Audience

Couples.

People who:
- constantly ask “what should we eat?”
- struggle to agree on meals
- want faster decisions
- save recipes but never use them
- feel decision fatigue around cooking

## Secondary Audience

Families.

Supports:
- children
- multiple household members
- guests
- dietary restrictions
- allergies

---

# Core Features

# 1. Swipe-Based Meal Matching

Users swipe recipe cards:

- Right → Like
- Left → Dislike
- Up → Superlike
- Down → Superdislike

Multiple household members participate.

The system finds the best meal match.

## Match Criteria

AI considers:

- preferences
- dislikes
- allergies
- recent meals
- pantry items
- preparation time
- weekly balance
- household compatibility

---

# 2. Household System

Each household contains:

- multiple users
- individual taste profiles
- shared pantry
- shared weekly plan
- shared meal history

Each user has:

- preferences
- dislikes
- allergies
- spice tolerance
- favorites
- behavior history

Children may:
- have managed profiles
- participate via simplified voting

---

# 3. AI Recommendation Engine

AI generates:

- daily recommendations
- pantry-based suggestions
- household-aware matches
- adapted recipes
- weekly meal plans
- explanation texts

Example:

> “Suggested because your partner likes pasta, you have chicken at home, and you haven’t cooked poultry in 5 days.”

---

# 4. Weekly Planner

Users can generate:

- balanced weekly meal plans
- budget-friendly plans
- healthy weeks
- busy-week plans
- comfort-food weeks

AI optimizes:

- ingredient reuse
- leftover management
- time constraints
- household satisfaction
- meal diversity

---

# 5. Pantry Intelligence

Users enter pantry items via text:

Example:

> chicken yogurt potatoes eggs tomatoes

AI parses and structures ingredients.

Then suggests meals based on:
- available ingredients
- missing ingredients
- household compatibility

---

# 6. Instagram Recipe Import

Users can import recipes via:

- Instagram link
- caption text
- screenshots

AI extracts:
- title
- ingredients
- steps
- estimated prep time
- tags
- compatibility

Imported recipes become swipeable cards.

---

# User Experience Design

# Core UX Principle

Users should never feel overwhelmed.

Goal:

> Reach a meal decision in under 2 minutes.

The app should feel:
- playful
- modern
- lightweight
- fast
- smart

Not like:
- recipe blogs
- calorie trackers
- complex planners

---

# Navigation Structure

Bottom Tab Navigation:

1. Home
2. Swipe
3. Weekly Plan
4. Pantry
5. Profile

---

# Home Screen

## Main CTA

“Start Meal Match”

## Quick Actions

- Suggest from pantry
- Generate weekly plan
- Import recipe
- Saved recipes

## Active Session Card

Examples:

- “Waiting for your partner’s vote”
- “Match found: Chicken Pasta”

## AI Suggestions

Examples:

- “You haven’t cooked soup recently.”
- “This week looks busy. Want quick meal ideas?”

---

# Onboarding Flow

# Step 1

Welcome screen.

Tagline:

> Swipe. Match. Cook.

---

# Step 2

Quick preference setup:

- allergies
- hard dislikes
- spice tolerance

Minimal onboarding.

---

# Step 3

Create household.

Example:

> “Our Home”

---

# Step 4

Invite partner.

Via:
- WhatsApp
- link
- QR code

---

# Step 5

Immediately start first swipe session.

---

# Swipe Session UX

Each recipe card contains:

- large image
- meal title
- prep time
- household compatibility %
- pantry compatibility
- AI explanation

Example:

## Chicken Pasta

- 25 mins
- 92% household compatibility
- 80% pantry match

AI note:

> “Your partner likes pasta and you already have chicken at home.”

---

# Match Result Screen

## Match Found

Displays:

- selected recipe
- why it matched
- who liked it
- alternatives
- missing ingredients

Alternative suggestions:

- faster option
- lighter option
- cheaper option

---

# Weekly Planner UX

Users choose a weekly mode:

- Busy week
- Healthy week
- Budget week
- Comfort food week
- Kids-friendly week

AI generates a weekly board.

Users may swipe individual days to regenerate.

---

# Notification Strategy

Good notifications:

- “Your partner is waiting for your vote.”
- “3 strong matches found for tonight.”
- “You can make 4 meals with your current pantry.”

Avoid spam.

---

# Gamification

Light gamification only.

Examples:

- weekly streaks
- most loved meals
- household compatibility insights
- favorite cuisine trends

---

# Technical Architecture

# Recommended Stack

## Mobile Frontend

### React Native + Expo

Reasons:
- fast iteration
- strong AI coding ecosystem
- iOS + Android from one codebase
- easy animations
- excellent developer velocity

---

## Backend

### Supabase

Reasons:
- PostgreSQL
- authentication
- realtime support
- storage
- row-level security
- scalable relational structure

---

## AI Layer

### OpenAI API

Used for:
- recommendation generation
- pantry parsing
- recipe adaptation
- weekly planning
- explanation generation
- Instagram recipe parsing

---

## Push Notifications

Expo Notifications.

---

# Frontend Architecture

# State Management

## TanStack Query

Server state.

## Zustand

Client state.

Avoid Redux in MVP.

---

# Core Components

## RecipeCard
Swipeable meal card.

## MatchCard
Final result card.

## SessionLobby
Session participant management.

## WeeklyDayCard
Weekly planner day item.

## PantryInput
Ingredient input component.

## AISuggestionBubble
AI explanation component.

---

# Suggested Folder Structure

```txt
src/
 ├── app/
 ├── components/
 ├── features/
 │    ├── auth/
 │    ├── household/
 │    ├── swipe/
 │    ├── planner/
 │    ├── pantry/
 │    ├── recipes/
 │    └── ai/
 ├── services/
 ├── hooks/
 ├── store/
 ├── lib/
 ├── utils/
 ├── types/
 └── constants/
```

---

# Backend Architecture

# Core Entities

## users

```sql
id
name
email
avatar_url
created_at
```

---

## households

```sql
id
name
created_by
created_at
```

---

## household_members

```sql
id
household_id
user_id
role
joined_at
```

---

## profiles

```sql
id
user_id
allergies
hard_dislikes
favorite_cuisines
spice_tolerance
created_at
```

---

## recipes

```sql
id
title
description
ingredients
steps
image_url
prep_time
difficulty
tags
created_at
```

---

## swipe_sessions

```sql
id
household_id
session_type
status
created_by
created_at
```

---

## votes

```sql
id
session_id
user_id
recipe_id
vote_type
created_at
```

---

## matches

```sql
id
session_id
recipe_id
score
created_at
```

---

## weekly_plans

```sql
id
household_id
week_start
plan_json
created_at
```

---

## pantry_items

```sql
id
household_id
ingredient_name
quantity
expires_at
created_at
```

---

# AI System Design

# AI Task 1 — Pantry Parser

Input:

> chicken yogurt potatoes eggs tomatoes

Output:

Structured pantry items.

---

# AI Task 2 — Recommendation Engine

Inputs:
- household preferences
- recent meals
- pantry
- session type
- time constraints

Output:
- ranked recipe recommendations

---

# AI Task 3 — Weekly Planner

Inputs:
- household
- budget
- weekly mode
- pantry
- time constraints

Output:
- optimized 7-day plan

---

# AI Task 4 — Recipe Adapter

Transforms recipes based on:
- allergies
- dislikes
- dietary goals
- available ingredients

---

# AI Task 5 — Explanation Generator

Generates human-readable recommendation explanations.

Example:

> “Suggested because your household hasn’t eaten vegetables recently and you already have zucchini at home.”

---

# Recommendation Scoring System

Example scoring model:

```txt
LIKE = +1
SUPERLIKE = +3
DISLIKE = -1
SUPERDISLIKE = -5
ALLERGY = hard reject
PANTRY_MATCH = +2
NOT_RECENTLY_EATEN = +1
TIME_MATCH = +1
```

Final recommendation score combines:
- household compatibility
- pantry fit
- behavioral learning
- session context

---

# Development Roadmap

# Phase 1 — MVP

## Goal

Validate:

> “Do people actually use this app daily to decide meals?”

## Features

- auth
- household system
- swipe sessions
- voting
- match results
- recipe pages
- pantry input
- AI recommendations
- weekly planning
- grocery list
- Instagram import lite

---

# Phase 2

- improved AI memory
- better personalization
- pantry intelligence
- realtime sync
- recipe saving
- analytics

---

# Phase 3

- social layer
- advanced AI planning
- nutrition intelligence
- barcode scanning
- OCR pantry input
- AI autopilot mode

---

# Monetization Strategy

# Free Tier

- daily meal matching
- limited AI planning
- basic weekly plans

---

# Premium Tier

- unlimited AI planning
- advanced optimization
- household analytics
- AI autopilot
- nutrition tracking
- advanced pantry intelligence

---

# Suggested Development Workflow

# Recommended Tools

## Cursor
Primary AI coding environment.

## ChatGPT / Claude
Architecture and feature generation.

## Supabase
Backend.

## Expo
Mobile app development.

---

# Suggested First 30 Days

# Week 1

- architecture
- auth
- database schema
- household system

---

# Week 2

- swipe cards
- recipe feed
- voting
- match engine

---

# Week 3

- AI recommendation system
- pantry parsing
- weekly planner

---

# Week 4

- onboarding polish
- notifications
- beta testing
- TestFlight
- Play Store internal testing

---

# Final Product Summary

This application is:

> A collaborative AI-powered meal decision platform that helps couples and households decide what to eat through swipe-based matching, personalized recommendations, pantry awareness, and intelligent weekly planning.

The real value is not recipes.

The real value is:

- reducing decision fatigue
- improving household coordination
- making meal planning fun
- learning household preferences over time
- becoming the household’s food memory and decision assistant

