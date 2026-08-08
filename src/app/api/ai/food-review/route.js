import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { refundId, reason, images } = await request.json();

    if (!refundId || !reason || !images || images.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let aiData = {
      verdict: "CUKUP",
      edibility_score: 0.5,
      freshness_score: 0.5,
      visual_score: 0.5,
      defect_score: 0.5,
      hygiene_score: 0.5,
      overall_score: 50,
      grade: "C"
    };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      const promptText = `Tugas kamu adalah menganalisis foto klaim refund makanan dan HANYA MENGELUARKAN JSON berisi skor.
Dilarang keras mengeluarkan teks deskriptif atau string selain nilai "verdict" dan "grade".

Pedoman Penilaian:
- Kelayakan Konsumsi: Apakah makanan masih tampak aman untuk dimakan. Perhatikan tanda jamur, pembusukan, atau kerusakan serius.
- Tingkat Kesegaran: Indikasi makanan masih baru atau sudah mulai kering dan menurun kualitasnya.
- Kualitas Visual: Tampilan keseluruhan, warna, bentuk, dan presentasi produk.
- Tingkat Kerusakan: Penyok, retak, gosong, sobek, atau cacat fisik lainnya. (Semakin kecil persentase kerusakannya semakin baik).
- Kebersihan & Kontaminasi Visual: Adanya kotoran, bercak mencurigakan, atau indikasi jamur yang terlihat. (1.0 = Sangat bersih, 0.0 = Terkontaminasi parah).

Berdasarkan pedoman di atas dan alasan klaim pelanggan: "${reason}"

Format JSON WAJIB:
{
  "verdict": "SANGAT_BAIK" / "BAIK" / "CUKUP" / "BURUK" / "SANGAT_BURUK",
  "edibility_score": [Skor kelayakan konsumsi, desimal 0.0 - 1.0 (1.0 = sangat layak)],
  "freshness_score": [Skor kesegaran, desimal 0.0 - 1.0 (1.0 = sangat segar)],
  "visual_score": [Skor kualitas visual, desimal 0.0 - 1.0 (1.0 = sangat bagus)],
  "defect_score": [Tingkat kerusakan, desimal 0.0 - 1.0 (tinggi = banyak cacat/kerusakan)],
  "hygiene_score": [Skor kebersihan, desimal 0.0 - 1.0 (1.0 = sangat bersih)],
  "overall_score": [Skor Keseluruhan bulat 0 - 100],
  "grade": ["A+" / "A" / "B" / "C" / "D" / "E"]
}`;

      const messageContent = [{ type: "text", text: promptText }];
      for (const image of images) {
        if (image && typeof image === 'string' && image.startsWith('data:image')) {
          messageContent.push({ type: "image_url", image_url: { url: image } });
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

        const data = await response.json();
        clearTimeout(timeout);

        if (response.ok) {
          const resultText = data?.choices?.[0]?.message?.content;
          if (resultText) {
            try {
              const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
              try {
                aiData = JSON.parse(cleanJson);
              } catch {
                const match = cleanJson.match(/\{[\s\S]*\}/);
                if (match) {
                  aiData = JSON.parse(match[0].replace(/'([^']+)'/g, '"$1"'));
                }
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      } catch (err) {
        clearTimeout(timeout);
        console.error("OpenRouter Error:", err);
      }
    }

    // Insert AI Review (service role)
    const { error: aiError } = await supabaseAdmin
      .from('ai_food_reviews')
      .insert({
        refund_id: refundId,
        quality_score: aiData.edibility_score,
        ai_analysis: JSON.stringify({ ...aiData, submitted_images: images })
      });

    if (aiError) {
      console.error('ai_food_reviews insert error:', aiError);
    }

    return NextResponse.json({ success: true, ...aiData });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
