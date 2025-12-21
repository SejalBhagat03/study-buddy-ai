import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, cardCount = 10 } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating flashcards for:", title);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert flashcard creator for educational content. Generate exactly ${cardCount} flashcards based on the provided study material. Each flashcard should test key concepts, definitions, or important facts.

Return your response as a valid JSON array with this exact structure:
[
  {
    "front": "The question or term to memorize",
    "back": "The answer or definition"
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, just the raw JSON.`
          },
          {
            role: "user",
            content: `Generate flashcards based on this study material about "${title || 'the topic'}":\n\n${content.substring(0, 8000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate flashcards");
    }

    const data = await response.json();
    const flashcardsContent = data.choices?.[0]?.message?.content;

    if (!flashcardsContent) {
      throw new Error("No flashcard content generated");
    }

    console.log("Raw flashcards content:", flashcardsContent);

    let flashcards;
    try {
      let cleanContent = flashcardsContent.trim();
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      flashcards = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse flashcards JSON:", parseError);
      throw new Error("Failed to parse flashcards response");
    }

    console.log("Generated", flashcards.length, "flashcards");

    return new Response(
      JSON.stringify({ flashcards }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Flashcard generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
