/**
 * Supabase Edge Function: generate-audio
 *
 * Fallback-TTS via OpenAI gpt-4o-mini-tts.
 * Wird von fetch_stories.py aufgerufen, wenn ElevenLabs nicht verfügbar ist.
 *
 * Nutzt den OPENAI_API_KEY aus den Supabase Edge Function Secrets.
 *
 * Payload: { text: string, slug: string }
 * Response: { audio_url: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { text, slug } = await req.json();

    if (!text || !slug) {
      return new Response(
        JSON.stringify({ error: "text and slug are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Text auf max 2000 Zeichen trimmen (~2 Min. Audio)
    const maxChars = 2000;
    let trimmed = text.slice(0, maxChars);
    if (text.length > maxChars) {
      const searchFrom = Math.max(0, maxChars - 200);
      const lastPeriod = text.lastIndexOf(".", maxChars);
      const lastExcl = text.lastIndexOf("!", maxChars);
      const lastQues = text.lastIndexOf("?", maxChars);
      const cut = Math.max(lastPeriod, lastExcl, lastQues);
      if (cut > maxChars / 2) {
        trimmed = text.slice(0, cut + 1);
      }
    }

    // OpenAI TTS: gpt-4o-mini-tts, Stimme nova (weiblich, warm) oder onyx (männlich, ruhig)
    const ttsResp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "nova", // weiblich, warm — passt zu NurEine
        input: trimmed,
        response_format: "mp3",
      }),
    });

    if (!ttsResp.ok) {
      const errText = await ttsResp.text();
      console.error("OpenAI TTS failed:", ttsResp.status, errText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: `OpenAI TTS failed: ${ttsResp.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mp3Data = await ttsResp.arrayBuffer();

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bucketName = "story_audio";
    const filePath = `${slug}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, new Uint8Array(mp3Data), {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload failed:", uploadError.message);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const audioUrl = publicUrlData.publicUrl;

    console.log(`Audio generated: ${audioUrl}`);

    return new Response(JSON.stringify({ audio_url: audioUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
