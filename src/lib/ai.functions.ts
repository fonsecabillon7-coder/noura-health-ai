import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

function langLabel(code: string) {
  return code === "pt-BR" ? "Brazilian Portuguese" : "English";
}

async function getUserLanguage(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("language").eq("user_id", userId).maybeSingle();
  return data?.language || "en-US";
}

// ============ Food image analysis ============
const foodSchema = z.object({
  name: z.string(),
  kcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  portion: z.string(),
  confidence: z.number(),
  ingredients: z.array(z.string()).default([]),
});

const ingredientsSchema = z.object({
  ingredients: z.array(z.string()),
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
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");
    const prompt = `Identify every distinct food ingredient visible in this photo (fridge, counter, pantry, or a dish). Return a concise list of common ingredient names in ${langLabel(lang)}. No brands, no quantities.`;
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: ingredientsSchema }),
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          { type: "image", image: data.imageDataUrl },
        ] }],
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) throw new Error("Could not detect ingredients");
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

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const prompt = `You are a nutrition expert. Analyze this food photo and estimate nutrition for a typical single serving as shown. Also list the detected ingredients (concise common names, no brands, no quantities).
Respond in ${langLabel(lang)}. Return realistic estimates. Confidence is 0-1.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: foodSchema }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: data.imageDataUrl },
            ],
          },
        ],
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Could not analyze image");
      }
      throw error;
    }
  });

// ============ Recipe generation ============
const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  servings: z.number(),
  prep_minutes: z.number(),
  ingredients: z.array(z.object({ item: z.string(), amount: z.string() })),
  steps: z.array(z.string()),
  macros: z.object({
    kcal: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
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
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `You are a creative chef. Create ONE healthy recipe using these ingredients: ${data.ingredients}.
${data.diet ? `Diet: ${data.diet}.` : ""}
${data.maxMinutes ? `Max prep time: ${data.maxMinutes} minutes.` : ""}
Respond in ${langLabel(lang)}. Provide realistic macro estimates per serving.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: recipeSchema }),
        prompt,
      });

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
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Could not generate recipe");
      }
      throw error;
    }
  });
