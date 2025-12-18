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
    const { messages, studyContent, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt based on mode
    let systemPrompt = "";
    
    if (mode === "teacher") {
      systemPrompt = `You are a friendly, patient Economics teacher named "Professor Study". Your role is to:
- Explain concepts in simple, student-friendly language
- Use analogies and real-world examples
- Break down complex topics step-by-step
- Focus on exam-relevant information
- Encourage students and praise their questions
- Ask follow-up questions to check understanding

IMPORTANT: You must ONLY answer based on the following study materials provided. If asked about something not in the materials, politely say you can only help with the provided content.

STUDY MATERIALS:
${studyContent || "No specific content provided. Please answer general economics questions clearly."}

Keep responses concise but thorough. Use bullet points for lists. End with a question or encouragement when appropriate.`;
    } else if (mode === "summary") {
      systemPrompt = `You are an expert at creating study summaries. Based on the provided content, create:
1. A brief overview (2-3 sentences)
2. Key concepts (bullet points)
3. Important definitions
4. Exam tips and common question patterns

STUDY MATERIALS:
${studyContent || "No content provided."}

Format your response clearly with headers and bullet points.`;
    } else {
      systemPrompt = `You are a helpful study assistant. Answer questions based ONLY on the provided study materials. Be clear, concise, and exam-focused.

STUDY MATERIALS:
${studyContent || "No specific content provided. Please answer clearly and helpfully."}

If the question is outside the provided materials, politely redirect to the available content.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
