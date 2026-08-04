import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/recipe-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { title, description } = (await request.json()) as {
          title?: string;
          description?: string;
        };
        if (!title) return new Response("Missing title", { status: 400 });
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const prompt = `Ultra realistic professional food photography of "${title}". ${description ?? ""} Overhead 45-degree shot, natural soft light, shallow depth of field, premium dark moody restaurant plating, appetizing, high detail, no text, no watermark.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!upstream.ok) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        const json: any = await upstream.json();
        const image =
          json?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
          json?.data?.[0]?.url ??
          null;
        if (!image) return new Response("No image", { status: 502 });
        return new Response(JSON.stringify({ image }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
