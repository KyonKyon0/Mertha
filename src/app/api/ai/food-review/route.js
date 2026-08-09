import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_AI_DATA = {
  is_same_product: true,
  verdict: "CUKUP",
  edibility_score: 0.5,
  freshness_score: 0.5,
  visual_score: 0.5,
  defect_score: 0.5,
  hygiene_score: 0.5,
  overall_score: 50,
  grade: "C"
};

const PROMPT = (reason) =>
  `Analisis foto klaim refund makanan ini. Jawab HANYA JSON tanpa teks lain.
Keluhan pembeli: "${reason}"

Format wajib:
{"is_same_product":true,"verdict":"CUKUP","edibility_score":0.5,"freshness_score":0.5,"visual_score":0.5,"defect_score":0.5,"hygiene_score":0.5,"overall_score":50,"grade":"C"}

verdict: SANGAT_BAIK/BAIK/CUKUP/BURUK/SANGAT_BURUK. grade: A+/A/B/C/D/E.`;

function parseJson(text) {
  if (!text) return null;
  // Strip <think>...</think> blocks from reasoning models (e.g. qwen3)
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const s = stripped.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*?\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  return null;
}

// Convert "data:image/jpeg;base64,..." → { mimeType, data }
function parseBase64Image(dataUrl) {
  const match = dataUrl?.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

/** PRIMARY: Gemini Flash with vision */
async function tryGemini(images, reason, timeoutMs = 20000) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const parts = [{ text: PROMPT(reason) }];

  // Attach images as inlineData
  for (const img of images) {
    if (typeof img !== 'string' || !img.startsWith('data:image')) continue;
    const parsed = parseBase64Image(img);
    if (parsed) parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });
    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('Gemini error:', res.status, err.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = parseJson(text);
    if (parsed) {
      console.log('Gemini succeeded.');
      return { data: parsed, model: 'Gemini 2.0 Flash' };
    }
    return null;
  } catch (e) {
    clearTimeout(timer);
    console.warn('Gemini failed:', e?.message || e);
    return null;
  }
}

/**
 * FALLBACK: Groq text-only (verified working 2026-08-09)
 * Models tested OK: llama-3.3-70b-versatile, qwen/qwen3.6-27b
 * Models decommissioned: llama3-8b-8192, mixtral-8x7b-32768, gemma2-9b-it
 */
async function tryGroq(reason, timeoutMs = 12000) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // llama-3.3-70b-versatile → clean JSON output (no think tags)
  // qwen/qwen3.6-27b → has <think> tags but parseJson handles it
  const MODELS = [
    "llama-3.3-70b-versatile",
    "qwen/qwen3.6-27b",
  ];

  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: PROMPT(reason) }],
          temperature: 0.6,
          max_tokens: 512,
          stream: false,
        })
      });
      clearTimeout(timer);

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        console.error(`Groq [${model}] error:`, res.status, err.slice(0, 200));
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      const parsed = parseJson(text);
      if (parsed) {
        console.log(`Groq [${model}] succeeded.`);
        // Display-friendly model name
        const displayName = model === 'llama-3.3-70b-versatile'
          ? 'Groq · LLaMA 3.3 70B'
          : 'Groq · Qwen 3.6 27B';
        return { data: parsed, model: displayName };
      }
    } catch (e) {
      clearTimeout(timer);
      console.warn(`Groq [${model}] failed:`, e?.message || e);
    }
  }
  return null;
}

export async function POST(request) {
  try {
    const { refundId, reason, images } = await request.json();

    if (!refundId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let aiData = { ...DEFAULT_AI_DATA };
    let aiModel = null;

    // Try Gemini first (with images + vision), then Groq as fallback
    const result = await tryGemini(images ?? [], reason) ?? await tryGroq(reason);
    if (result) {
      aiData = result.data;
      aiModel = result.model;
    }

    // Persist asynchronously — don't block response
    supabaseAdmin.from('ai_food_reviews').insert({
      refund_id: refundId,
      quality_score: aiData.edibility_score ?? 0.5,
      ai_analysis: JSON.stringify({ ...aiData, ai_model: aiModel, submitted_images: images ?? [] })
    }).then(({ error }) => { if (error) console.error('DB insert error:', error); });

    return NextResponse.json({ success: true, ai_model: aiModel, ...aiData });

  } catch (error) {
    console.error('food-review error:', error);
    return NextResponse.json({ success: true, ai_model: null, ...DEFAULT_AI_DATA });
  }
}
