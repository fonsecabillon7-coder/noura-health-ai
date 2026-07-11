# Noura AI — Full Build Plan

The request bundles five large workstreams. I'll ship them in one coordinated pass, but flagging scope up front so we don't lose quality. If any block below is not a priority for you, tell me and I'll drop it.

## 1. Auth + Supabase schema + real persistence

- Supabase email/password auth (screen at `/auth`, protected `/_authenticated/` layout).
- `profiles` (user_id FK to `auth.users`, name, language, locale, timezone, measurement_system, goal, targets kcal/protein/carbs/fat/water, streak fields).
- `meals` (user_id, name, kcal, protein, carbs, fat, fiber, image_url, source: scan|recipe|manual, eaten_at).
- `water_logs` (user_id, ml, logged_at).
- `habits` (user_id, name, icon, category, frequency, reminder_time, active).
- `habit_logs` (user_id, habit_id, completed_on date).
- `recipes` (user_id, title, description, servings, prep_time, ingredients jsonb, steps jsonb, macros jsonb, image_url).
- All tables: RLS scoped to `auth.uid()`, explicit GRANTs, `service_role` grant.
- Move dashboard/meals/water/habits/profile under `_authenticated/`; keep landing/intro/quiz/auth public.
- Onboarding quiz results write to `profiles` after signup.

## 2. AI food scan + AI recipe generator (Lovable AI Gateway)

- Server fns in `src/lib/ai.functions.ts` using `@ai-sdk/openai-compatible` + `LOVABLE_API_KEY`.
- `analyzeFoodImage`: multimodal `google/gemini-3-flash-preview`, structured output (name, kcal, macros, confidence, portion). Wired into `/scan` — after camera capture (or file upload fallback in preview), show result sheet with real numbers, "Add to log" persists to `meals`.
- `generateRecipe`: prompt-based (ingredients, dietary prefs, time), structured output (title, description, ingredients[], steps[], macros). Wired into `/recipes` with a "Generate" form; results save to `recipes` table and can be logged as a meal.
- Language of output = user's `profile.language`.

## 3. Dashboard v2 + streaks + score

- Redesigned `/dashboard`: greeting + date + rotating motivation line, Today's Progress card with animated rings for kcal/protein/carbs/water/habits.
- Nutrition cards: consumed, remaining, protein, carbs, fat, fiber.
- Hydration section: percent + consumed + remaining + "Add Water" (persists, updates ring instantly via TanStack Query invalidation).
- **Balance Score**: 0–100 animated ring = weighted average of kcal adherence, hydration %, habits completion, 7-day consistency.
- **Streaks**: computed server-side from `meals`, `water_logs`, `habit_logs`. Overall, nutrition, hydration, habits, recipes. Premium card with 🔥 current / longest / weekly bars.
- Achievements: subtle toast celebration on threshold crossings (7d, 30d, first hydration goal, etc.) — computed client-side from streak data, no separate table needed.

## 4. Focos (habits) — new nav section

- Bottom nav updated to: Home, Meals, Recipes, **Focos**, Profile (center + button kept for scan).
- `/focos` screen: "Your Daily Focus" with premium habit cards (gradient, icon, name, description, completion toggle). Tap → optimistic complete → haptic (navigator.vibrate) → streak/score update.
- Default habit templates seeded on first visit (water, workout, read, sleep, meals, meditate, walk, supplements).
- "New habit" sheet: name, icon picker, category, frequency (daily / weekdays / custom days), reminder time.
- `/focos/history`: month calendar with completed/missed dots, current + longest streak, weekly & monthly completion rate.

## 5. Internationalization (EN-US default, PT-BR)

- `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- `src/locales/en-US.json`, `src/locales/pt-BR.json` — complete keys for landing, intro, quiz, auth, dashboard, meals, recipes, focos, profile, notifications, errors.
- Globe icon in top-right of landing, intro, quiz, auth → glass modal with 🇺🇸 English (US) / 🇧🇷 Português (Brasil).
- Signed-in users: language stored in `profiles.language`; changes on any device sync via query invalidation.
- Locale-aware dates (`Intl.DateTimeFormat`), numbers, and measurement conversion helpers (kg↔lb, cm↔ft/in, ml↔oz). Settings toggle in `/profile` for measurement_system override.
- AI prompts include `Respond in ${language}` so recipes/analysis come back localized.

## Technical section

```text
src/
  routes/
    index.tsx            (landing, public, i18n + lang switcher)
    intro.tsx quiz.tsx processing.tsx auth.tsx   (public)
    _authenticated/
      route.tsx          (managed gate — already present)
      dashboard.tsx meals.tsx recipes.tsx focos.tsx focos.history.tsx
      profile.tsx scan.tsx
  lib/
    ai.functions.ts      (analyzeFoodImage, generateRecipe)
    ai-gateway.server.ts (Lovable AI provider helper)
    data.functions.ts    (logMeal, logWater, getToday, listMeals,
                          listWater, computeStreaks, computeScore,
                          listHabits, toggleHabit, createHabit,
                          habitHistory, upsertProfile, setLanguage)
    i18n.ts              (i18next init)
    units.ts             (measurement conversions)
  locales/en-US.json  locales/pt-BR.json
  components/
    lang-switcher.tsx  progress-ring.tsx  streak-card.tsx
    balance-score.tsx  habit-card.tsx  new-habit-sheet.tsx
```

- Server fns via `createServerFn` + `requireSupabaseAuth` (bearer already wired).
- Data reads: `queryClient.ensureQueryData` in loaders, `useSuspenseQuery` in components; mutations invalidate.
- One SQL migration for all tables + RLS + GRANTs + seed default habit templates function.

## Out of scope for this pass (say the word to add)

- Push notifications (needs a native shell or web-push infra).
- Subscriptions / paywall.
- Barcode + nutrition-label OCR (kept as UI tabs; scan flow ships photo-only).
- Additional locales beyond EN-US / PT-BR (architecture is ready).

Approve and I'll build all five blocks in one go.
