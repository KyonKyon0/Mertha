import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side supabase with service role — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { orderId, userId, reason, images } = await request.json();

    if (!orderId || !reason || !images || images.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // --- 1. Call OpenRouter AI (Vision) ---
    let aiData = {
      verdict: "MENUNGGU",
      quality_score: 0.2,
      ai_analysis: "Analisis lengkap belum tersedia karena sistem AI sedang sibuk. Sistem akan secara otomatis meneruskan klaim ini ke tim admin untuk peninjauan lebih lanjut.",
      verdict_reason: "Sistem sibuk, diteruskan ke review manual.",
      recommendations: ["Harap bersabar menunggu tim admin memverifikasi keluhan Anda.", "Simpan foto makanan sebagai bukti jika diperlukan oleh tim kami."],
      warnings: [],
      ai_model_vision: "NVIDIA Nemotron 12B VL",
      ai_model_analyst: "N/A"
    };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      const visionPromptText = `You are a professional Food Quality Inspector. 
User's claim: "${reason}"
Observe the provided image(s). Does the visual evidence support the user's claim, or contradict it? 
For example, if they claim it is rotten/bad but it looks fresh/good, state that clearly.
Provide a concise, objective observation in English describing exactly what you see in the images compared to the claim.`;

      const messageContent = [{ type: "text", text: visionPromptText }];
      for (const image of images) {
        if (image && typeof image === 'string' && image.startsWith('data:image')) {
          messageContent.push({ type: "image_url", image_url: { url: image } });
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 40000);

      try {
        const visionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://mertha.app",
            "X-Title": "Mertha Food Review (Vision)",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-nano-12b-v2-vl:free",
            messages: [{ role: "user", content: messageContent }]
          })
        });

        const visionData = await visionResponse.json();
        const visionObservation = visionData?.choices?.[0]?.message?.content || "No visual observation available.";
        
        // --- 2. Call OpenRouter AI (Text/Analyst) ---
        const textPrompt = `Kamu adalah AI asisten korporat untuk platform "Mertha", aplikasi penyelamat makanan berlebih di Indonesia.
Tugas kamu adalah menganalisis klaim refund dari pembeli, memberikan penilaian yang adil, elegan, profesional, dan mudah dipahami.
Kamu harus berpihak pada objektivitas. Jika pembeli terdeteksi berbohong (klaim tidak sesuai foto), tegur dengan bahasa korporat yang sopan namun tegas (misal: "Berdasarkan analisis visual menyeluruh kami, kondisi produk tampak optimal dan tidak menunjukkan kendala seperti yang dilaporkan").

Klaim pembeli: "${reason}"
Hasil observasi dari AI Vision (dalam bahasa Inggris): "${visionObservation}"

Berdasarkan observasi AI Vision di atas, buatlah keputusan akhir. Keluarkan analisis lengkap dalam format JSON murni (TANPA markdown, TANPA kode blok). PASTIKAN HANYA MENGGUNAKAN KUTIP GANDA (DOUBLE QUOTES "") UNTUK STRING, JANGAN GUNAKAN KUTIP TUNGGAL ('')!:
{
  "verdict": "SANGAT_BAIK" / "BAIK" / "CUKUP" / "BURUK" / "SANGAT_BURUK",
  "quality_score": (0.0-1.0, 0=sangat buruk/penipuan, 1=sangat baik),
  "ai_analysis": "Penjelasan analisis yang keren, empatik, dan korporat (3-4 kalimat).",
  "verdict_reason": "1 kalimat alasan utama penilaian secara profesional.",
  "recommendations": ["Saran 1 untuk pembeli (korporat)", "Saran 2"],
  "warnings": ["Peringatan elegan jika ada indikasi klaim tidak akurat/palsu."],
  "ai_model_vision": "NVIDIA Nemotron 12B VL",
  "ai_model_analyst": "Google Gemma 9B"
}`;

        const analystResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://mertha.app",
            "X-Title": "Mertha Food Review (Analyst)",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemma-2-9b-it:free",
            messages: [{ role: "user", content: textPrompt }]
          })
        });

        const analystData = await analystResponse.json();
        clearTimeout(timeout);

        if (!analystResponse.ok) {
          console.error("OpenRouter Analyst error:", analystResponse.status, JSON.stringify(analystData));
        } else {
          const resultText = analystData?.choices?.[0]?.message?.content;
          if (resultText) {
            try {
              const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
              try {
                aiData = JSON.parse(cleanJson);
              } catch {
                try {
                  const match = cleanJson.match(/\{[\s\S]*\}/);
                  if (match) {
                    aiData = JSON.parse(match[0]);
                  }
                } catch {
                  const match = cleanJson.match(/\{[\s\S]*\}/);
                  if (match) {
                    const fixedJson = match[0].replace(/'([^']+)'/g, '"$1"');
                    aiData = JSON.parse(fixedJson);
                  }
                }
              }
            } catch (e) {
              console.error("Failed to parse AI response:", resultText, e);
            }
          }
        }
      } catch (fetchErr) {
        clearTimeout(timeout);
        console.error(fetchErr.name === 'AbortError' ? "OpenRouter timeout" : "OpenRouter fetch error: " + fetchErr.message);
      }
    }

    // --- 2. Insert Refund (service role) ---
    const { data: refundData, error: refundError } = await supabaseAdmin
      .from('refunds')
      .insert({
        order_id: orderId,
        user_id: userId,
        reason: reason,
        status: 'pending'
      })
      .select('id')
      .single();

    if (refundError) {
      console.error('Refund insert error:', refundError);
      return NextResponse.json({ error: "Gagal menyimpan refund: " + refundError.message }, { status: 500 });
    }

    // --- 3. Insert AI Review (service role) ---
    const { error: aiError } = await supabaseAdmin
      .from('ai_food_reviews')
      .insert({
        refund_id: refundData.id,
        quality_score: aiData.quality_score,
        // Store full aiData as JSON string in ai_analysis column so we don't need to alter DB schema
        ai_analysis: JSON.stringify(aiData)
      });

    if (aiError) {
      console.error('ai_food_reviews insert error:', aiError);
    }

    return NextResponse.json({ success: true, refundId: refundData.id, ...aiData });

  } catch (error) {
    console.error("AI Review Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

