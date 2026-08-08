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

    // --- 1. Call OpenRouter AI ---
    let aiData = {
      verdict: "MENUNGGU",
      quality_score: 0.2,
      ai_analysis: "Analisis lengkap belum tersedia karena sistem AI sedang sibuk. Sistem akan secara otomatis meneruskan klaim ini ke tim admin untuk peninjauan lebih lanjut.",
      verdict_reason: "Sistem sibuk, diteruskan ke review manual.",
      recommendations: ["Harap bersabar menunggu tim admin memverifikasi keluhan Anda.", "Simpan foto makanan sebagai bukti jika diperlukan oleh tim kami."],
      warnings: []
    };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      const promptText = `Anda adalah Food Quality AI Inspector profesional untuk platform "Mertha", aplikasi penyelamat makanan berlebih di Indonesia.
Tugas Anda: menganalisis klaim refund dari pembeli dan memberikan penilaian yang adil, jelas, dan mudah dipahami.

Keluhan pembeli: "${reason}"
Jumlah foto bukti diunggah: ${images.length} foto

Berikan analisis lengkap dalam format JSON murni (TANPA markdown, TANPA kode blok). PASTIKAN HANYA MENGGUNAKAN KUTIP GANDA (DOUBLE QUOTES "") UNTUK STRING, JANGAN GUNAKAN KUTIP TUNGGAL ('')!:
{
  "verdict": "SANGAT_BAIK" atau "BAIK" atau "CUKUP" atau "BURUK" atau "SANGAT_BURUK",
  "quality_score": (0.0-1.0, 0=sangat buruk, 1=sangat baik),
  "ai_analysis": "Narasi panjang 3-4 kalimat. BACA DENGAN TELITI: Anda WAJIB membandingkan keluhan teks pembeli dengan foto yang diunggah! Jika foto menunjukkan makanan yang segar, bagus, dan tidak rusak, TETAPI pembeli menulis keluhan bahwa makanan itu busuk/hancur, maka Anda harus menyatakan klaim ini PALSU/BOHONG. Jangan mudah tertipu oleh teks keluhan!",
  "verdict_reason": "1 kalimat singkat alasan utama penilaian. Jika bohong, sebutkan ketidaksesuaian foto dan teks.",
  "recommendations": ["Saran 1 untuk pembeli", "Saran 2"],
  "warnings": ["Peringatan jika ada ketidaksesuaian antara foto (bagus) dengan klaim (busuk), yang menandakan penipuan/klaim palsu."]
}`;

      // Vision model — supports image_url
      const messageContent = [{ type: "text", text: promptText }];
      for (const image of images) {
        if (image && typeof image === 'string' && image.startsWith('data:image')) {
          messageContent.push({ type: "image_url", image_url: { url: image } });
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://mertha.app",
            "X-Title": "Mertha Food Review",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-nano-12b-v2-vl:free",
            messages: [{ role: "user", content: messageContent }]
          })
        });

        const responseData = await openRouterResponse.json();
        clearTimeout(timeout);

        if (!openRouterResponse.ok) {
          console.error("OpenRouter error:", openRouterResponse.status, JSON.stringify(responseData));
        } else {
          const resultText = responseData?.choices?.[0]?.message?.content;
          if (resultText) {
            try {
              const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
              // Try full parse first, then regex extract, then single quote fix
              try {
                aiData = JSON.parse(cleanJson);
              } catch {
                try {
                  const match = cleanJson.match(/\{[\s\S]*\}/);
                  if (match) {
                    aiData = JSON.parse(match[0]);
                  }
                } catch {
                  // Fallback: fix single quotes used for arrays/strings
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
          } else {
            console.error("Empty choices:", JSON.stringify(responseData));
          }
        }
      } catch (fetchErr) {
        clearTimeout(timeout);
        console.error(fetchErr.name === 'AbortError' ? "OpenRouter timeout 90s" : "OpenRouter fetch error: " + fetchErr.message);
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

