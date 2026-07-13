import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ============ Profile ============
export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles").select("*").eq("user_id", context.userId).maybeSingle();
    return data;
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.record(z.string(), z.any()).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await (context.supabase.from("profiles") as any)
      .update(data)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

// ============ Meals ============
export const listMealsToday = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await context.supabase
      .from("meals").select("*")
      .eq("user_id", context.userId)
      .gte("eaten_at", start.toISOString())
      .order("eaten_at", { ascending: false });
    return data ?? [];
  });

export const listMealsAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("meals").select("*")
      .eq("user_id", context.userId)
      .order("eaten_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

export const logMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      name: z.string(),
      kcal: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number().default(0),
      source: z.string().default("manual"),
      image_url: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("meals").insert({ ...data, user_id: context.userId }).select("*").single();
    if (error) throw error;
    return row;
  });

// ============ Water ============
export const listWaterToday = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data } = await context.supabase
      .from("water_logs").select("*")
      .eq("user_id", context.userId)
      .gte("logged_at", start.toISOString());
    return data ?? [];
  });

export const logWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ ml: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("water_logs")
      .insert({ user_id: context.userId, ml: data.ml });
    if (error) throw error;
    return { ok: true };
  });

export const getWaterHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const from = new Date(); from.setDate(from.getDate() - 29); from.setHours(0,0,0,0);
    const { data } = await context.supabase
      .from("water_logs").select("ml, logged_at")
      .eq("user_id", context.userId)
      .gte("logged_at", from.toISOString());
    const byDay: Record<string, number> = {};
    (data ?? []).forEach((r: any) => {
      const d = r.logged_at.slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + Number(r.ml);
    });
    const days: { date: string; ml: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, ml: byDay[key] ?? 0 });
    }
    const { data: profile } = await context.supabase
      .from("profiles").select("water_goal_ml").eq("user_id", context.userId).maybeSingle();
    const goal = (profile as any)?.water_goal_ml ?? 2000;
    const active = days.filter((d) => d.ml > 0);
    const avg = active.length ? Math.round(active.reduce((s, d) => s + d.ml, 0) / active.length) : 0;
    // streak of days meeting goal
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].ml >= goal) streak++;
      else if (i !== days.length - 1) break;
      else break;
    }
    return { days, goal, avg, streak };
  });



// ============ Habits ============
const DEFAULT_HABITS = [
  { name: "Drink water", icon: "💧", category: "hydration", sort_order: 1 },
  { name: "Workout", icon: "🏋️", category: "fitness", sort_order: 2 },
  { name: "Read", icon: "📖", category: "mind", sort_order: 3 },
  { name: "Sleep routine", icon: "😴", category: "sleep", sort_order: 4 },
  { name: "Prepare meals", icon: "🥗", category: "nutrition", sort_order: 5 },
  { name: "Meditate", icon: "🧘", category: "mind", sort_order: 6 },
  { name: "Walk", icon: "🚶", category: "fitness", sort_order: 7 },
  { name: "Supplements", icon: "💊", category: "health", sort_order: 8 },
];

export const listHabits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let { data } = await context.supabase
      .from("habits").select("*")
      .eq("user_id", context.userId)
      .eq("active", true)
      .order("sort_order");
    if (!data || data.length === 0) {
      // Seed defaults
      await context.supabase.from("habits").insert(
        DEFAULT_HABITS.map((h) => ({ ...h, user_id: context.userId })),
      );
      const res = await context.supabase.from("habits").select("*")
        .eq("user_id", context.userId).eq("active", true).order("sort_order");
      data = res.data;
    }
    const today = new Date().toISOString().slice(0, 10);
    const { data: logs } = await context.supabase
      .from("habit_logs").select("habit_id")
      .eq("user_id", context.userId).eq("completed_on", today);
    const done = new Set((logs ?? []).map((l: any) => l.habit_id));
    return (data ?? []).map((h: any) => ({ ...h, completed_today: done.has(h.id) }));
  });

export const toggleHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ habitId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await context.supabase
      .from("habit_logs").select("id")
      .eq("user_id", context.userId).eq("habit_id", data.habitId).eq("completed_on", today).maybeSingle();
    if (existing) {
      await context.supabase.from("habit_logs").delete().eq("id", existing.id);
      return { completed: false };
    }
    await context.supabase.from("habit_logs")
      .insert({ user_id: context.userId, habit_id: data.habitId, completed_on: today });
    return { completed: true };
  });

export const createHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    name: z.string().min(1),
    icon: z.string().default("✨"),
    category: z.string().optional(),
    frequency: z.string().default("daily"),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("habits")
      .insert({ ...data, user_id: context.userId, sort_order: 99 })
      .select("*").single();
    if (error) throw error;
    return row;
  });

export const deleteHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ habitId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.from("habits").update({ active: false }).eq("id", data.habitId);
    return { ok: true };
  });

export const habitHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const from = new Date(); from.setDate(from.getDate() - 60);
    const { data } = await context.supabase
      .from("habit_logs").select("habit_id, completed_on")
      .eq("user_id", context.userId)
      .gte("completed_on", from.toISOString().slice(0, 10));
    return data ?? [];
  });

// ============ Streaks & Score ============
function computeStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };
  const set = new Set(dates);
  const today = new Date();
  let current = 0;
  const cursor = new Date(today);
  // Streak counts backwards; if today isn't logged, start from yesterday for current
  const todayStr = today.toISOString().slice(0, 10);
  if (!set.has(todayStr)) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  // Longest
  const sorted = [...set].sort();
  let longest = 0, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]); prev.setDate(prev.getDate() + 1);
    if (prev.toISOString().slice(0, 10) === sorted[i]) run++;
    else { longest = Math.max(longest, run); run = 1; }
  }
  longest = Math.max(longest, run);
  return { current, longest };
}

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const from30 = new Date(); from30.setDate(from30.getDate() - 60);

    const [{ data: profile }, { data: todayMeals }, { data: todayWater }, { data: habits }, { data: habitLogs }, { data: recentMeals }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("meals").select("*").eq("user_id", userId).gte("eaten_at", start.toISOString()),
      supabase.from("water_logs").select("*").eq("user_id", userId).gte("logged_at", start.toISOString()),
      supabase.from("habits").select("*").eq("user_id", userId).eq("active", true),
      supabase.from("habit_logs").select("completed_on, habit_id").eq("user_id", userId).gte("completed_on", from30.toISOString().slice(0, 10)),
      supabase.from("meals").select("*").eq("user_id", userId).order("eaten_at", { ascending: false }).limit(5),
    ]);

    const meals = todayMeals ?? [];
    const water = todayWater ?? [];
    const kcal = meals.reduce((s: number, m: any) => s + Number(m.kcal), 0);
    const protein = meals.reduce((s: number, m: any) => s + Number(m.protein), 0);
    const carbs = meals.reduce((s: number, m: any) => s + Number(m.carbs), 0);
    const fat = meals.reduce((s: number, m: any) => s + Number(m.fat), 0);
    const fiber = meals.reduce((s: number, m: any) => s + Number(m.fiber), 0);
    const waterMl = water.reduce((s: number, w: any) => s + Number(w.ml), 0);

    const today = new Date().toISOString().slice(0, 10);
    const doneToday = new Set((habitLogs ?? []).filter((l: any) => l.completed_on === today).map((l: any) => l.habit_id));
    const habitsTotal = habits?.length ?? 0;
    const habitsDone = doneToday.size;

    // Streaks — per surface + overall
    const mealDates = new Set<string>();
    const { data: mealDateRows } = await supabase.from("meals")
      .select("eaten_at").eq("user_id", userId).gte("eaten_at", from30.toISOString());
    (mealDateRows ?? []).forEach((r: any) => mealDates.add(r.eaten_at.slice(0, 10)));
    const { data: waterDateRows } = await supabase.from("water_logs")
      .select("logged_at").eq("user_id", userId).gte("logged_at", from30.toISOString());
    const waterDates = new Set<string>();
    (waterDateRows ?? []).forEach((r: any) => waterDates.add(r.logged_at.slice(0, 10)));
    const habitDates = new Set<string>((habitLogs ?? []).map((l: any) => l.completed_on));

    const streakMeals = computeStreak([...mealDates]);
    const streakWater = computeStreak([...waterDates]);
    const streakHabits = computeStreak([...habitDates]);
    const overallDates = new Set<string>([...mealDates, ...waterDates, ...habitDates]);
    const streakOverall = computeStreak([...overallDates]);

    // Weekly consistency (last 7 days with any activity)
    const week: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const s = d.toISOString().slice(0, 10);
      week.push(overallDates.has(s) ? 1 : 0);
    }
    const weeklyPct = Math.round((week.reduce((a, b) => a + b, 0) / 7) * 100);

    // Balance score
    const kcalGoal = profile?.kcal_goal ?? 2200;
    const waterGoal = profile?.water_goal_ml ?? 2000;
    const kcalScore = Math.max(0, 1 - Math.abs(kcal - kcalGoal) / kcalGoal);
    const waterScore = Math.min(1, waterMl / waterGoal);
    const habitsScore = habitsTotal > 0 ? habitsDone / habitsTotal : 0;
    const consistencyScore = weeklyPct / 100;
    const balanceScore = Math.round(
      (kcalScore * 0.3 + waterScore * 0.25 + habitsScore * 0.25 + consistencyScore * 0.2) * 100,
    );

    return {
      profile,
      totals: { kcal, protein, carbs, fat, fiber, waterMl },
      goals: {
        kcal: kcalGoal,
        protein: profile?.protein_goal ?? 140,
        carbs: profile?.carbs_goal ?? 250,
        fat: profile?.fat_goal ?? 70,
        fiber: profile?.fiber_goal ?? 30,
        waterMl: waterGoal,
      },
      habits: { total: habitsTotal, done: habitsDone },
      streaks: {
        overall: streakOverall,
        meals: streakMeals,
        water: streakWater,
        habits: streakHabits,
      },
      weekly: { pct: weeklyPct, days: week },
      balanceScore,
      recentMeals: recentMeals ?? [],
    };
  });
