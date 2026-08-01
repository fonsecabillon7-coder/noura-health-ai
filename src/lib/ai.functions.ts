import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

function langLabel(code: string) {
  return code === "pt-BR" ? "Brazilian Portuguese" : "English";
}

async function getUserLanguage(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("language").eq("user_id", userId).maybeSingle();
  return data?.language || "en-US";
}

const AI_MODEL = "google/gemini-3.5-flash";

function extractJson(text: string): unknown | null {
  const cleaned = text.replace(/```json/gi, "```").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function dataUrlMediaType(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)[;,]/i);
  return match?.[1] || "image/jpeg";
}

const numberFromAi = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : value;
  }
  return value;
}, z.number());

const ingredientNamesFromAi = z.preprocess((value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const candidate = record.name ?? record.item ?? record.ingredient ?? record.food;
        return typeof candidate === "string" ? candidate : null;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item?.trim()))
    .map((item) => item.trim());
}, z.array(z.string()));

async function generateJsonFromImage<T>(args: {
  key: string;
  imageDataUrl: string;
  prompt: string;
  schema: z.ZodType<T>;
  fallback: T;
}) {
  const gateway = createLovableAiGatewayProvider(args.key);
  const model = gateway(AI_MODEL);
  const result = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: args.prompt },
          { type: "file", data: args.imageDataUrl, mediaType: dataUrlMediaType(args.imageDataUrl) },
        ],
      },
    ],
  });

  const parsed = extractJson(result.text);
  const checked = args.schema.safeParse(parsed);
  if (checked.success) return checked.data;

  console.warn("AI returned non-JSON nutrition payload", {
    text: result.text.slice(0, 500),
    issues: checked.error.issues.slice(0, 3),
  });
  return args.fallback;
}

// ============ Food image analysis ============
const foodSchema = z.object({
  name: z.string(),
  kcal: numberFromAi,
  protein: numberFromAi,
  carbs: numberFromAi,
  fat: numberFromAi,
  fiber: numberFromAi,
  portion: z.string(),
  confidence: numberFromAi,
  ingredients: ingredientNamesFromAi.default([]),
});

const ingredientsSchema = z.object({
  ingredients: ingredientNamesFromAi,
});

export const detectIngredients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ imageDataUrl: z.string().min(20) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const lang = await getUserLanguage(context.supabase, context.userId);
    const prompt = `You are Neura AI's food-vision engine. Identify every distinct edible ingredient visible in this camera photo, even if the image is blurry, dark, partial, or handheld. Do not refuse. If uncertain, make the best visual estimate.

Return ONLY valid JSON in this exact shape:
{"ingredients":["ingredient name"]}

Rules:
- Common ingredient names in ${langLabel(lang)}.
- No brands.
- No quantities.
- Never include non-food objects.`;
    try {
      return await generateJsonFromImage({
        key,
        imageDataUrl: data.imageDataUrl,
        prompt,
        schema: ingredientsSchema,
        fallback: { ingredients: [] },
      });
    } catch (error) {
      console.error("Ingredient detection failed", error);
      throw error;
    }
  });

export const analyzeFoodImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ imageDataUrl: z.string().min(20) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const lang = await getUserLanguage(context.supabase, context.userId);

    const prompt = `You are Neura AI's nutrition-vision engine. Analyze this food camera photo and estimate nutrition for the single serving visible in the frame. The photo may be blurry, dark, angled, partially cropped, or handheld. Do not refuse and do not say you cannot analyze it. Make the best realistic estimate from visible food.

Return ONLY valid JSON in this exact shape:
{"name":"dish name","kcal":450,"protein":25,"carbs":45,"fat":18,"fiber":4,"portion":"1 plate / visible serving","confidence":0.72,"ingredients":["ingredient"]}

Rules:
- Respond field values in ${langLabel(lang)} where text is needed.
- Numbers are grams except kcal and confidence.
- Confidence is 0 to 1.
- Use realistic nutrition values for the portion shown.
- Include visible ingredients only; no brands; no markdown.`;

    try {
      return await generateJsonFromImage({
        key,
        imageDataUrl: data.imageDataUrl,
        prompt,
        schema: foodSchema,
        fallback: {
          name: lang === "pt-BR" ? "Refeição escaneada" : "Scanned meal",
          kcal: 450,
          protein: 24,
          carbs: 48,
          fat: 16,
          fiber: 4,
          portion: lang === "pt-BR" ? "1 porção visível" : "1 visible serving",
          confidence: 0.35,
          ingredients: [],
        },
      });
    } catch (error) {
      console.error("Food image analysis failed", error);
      throw error;
    }
  });

// ============ Recipe generation ============
const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  servings: numberFromAi,
  prep_minutes: numberFromAi,
  ingredients: z.array(z.object({ item: z.string(), amount: z.string() })),
  steps: z.array(z.string()),
  macros: z.object({
    kcal: numberFromAi,
    protein: numberFromAi,
    carbs: numberFromAi,
    fat: numberFromAi,
  }),
});

export const generateRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      ingredients: z.string().min(2),
      diet: z.string().optional(),
      maxMinutes: z.number().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const lang = await getUserLanguage(context.supabase, context.userId);

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway(AI_MODEL);

    const prompt = `You are Neura AI's premium nutrition chef. Create ONE healthy, practical recipe using these ingredients: ${data.ingredients}.
${data.diet ? `Diet: ${data.diet}.` : ""}
${data.maxMinutes ? `Max prep time: ${data.maxMinutes} minutes.` : ""}
Respond in ${langLabel(lang)}.

Return ONLY valid JSON in this exact shape:
{"title":"Recipe title","description":"short premium description","servings":2,"prep_minutes":20,"ingredients":[{"item":"ingredient","amount":"amount"}],"steps":["step"],"macros":{"kcal":420,"protein":28,"carbs":35,"fat":16}}

Macros are realistic estimates per serving. No markdown.`;

    try {
      const result = await generateText({
        model,
        prompt,
      });

      const parsed = extractJson(result.text);
      const checked = recipeSchema.safeParse(parsed);
      if (!checked.success) {
        console.warn("AI returned non-JSON recipe payload", {
          text: result.text.slice(0, 500),
          issues: checked.error.issues.slice(0, 3),
        });
        throw new Error("Could not generate recipe");
      }

      const output = checked.data;

      // Persist
      const { data: saved } = await context.supabase
        .from("recipes")
        .insert({
          user_id: context.userId,
          title: output.title,
          description: output.description,
          servings: output.servings,
          prep_minutes: output.prep_minutes,
          ingredients: output.ingredients,
          steps: output.steps,
          macros: output.macros,
          language: lang,
        })
        .select("*")
        .single();
      return saved ?? output;
    } catch (error) {
      console.error("Recipe generation failed", error);
      throw error;
    }
  });
