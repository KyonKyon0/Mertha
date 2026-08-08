"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ShieldAlert, CheckCircle2, XCircle, ShieldCheck, HelpCircle, Info } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// Animated progress bar score
function ScoreBar({ label, value, inverted = false }) {
  const [width, setWidth] = useState(0);
  const pct = Math.round(value * 100);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  // For fraud score: high = bad (red). For quality: high = good (green)
  let barColor = 'bg-mertha-success';
  if (inverted) {
    if (pct > 60) barColor = 'bg-mertha-error';
    else if (pct > 30) barColor = 'bg-mertha-accent';
    else barColor = 'bg-mertha-success';
  } else {
    if (pct < 40) barColor = 'bg-mertha-error';
    else if (pct < 70) barColor = 'bg-mertha-accent';
    else barColor = 'bg-mertha-success';
  }

  let textColor = barColor.replace('bg-', 'text-');

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-mertha-text">{label}</span>
        <span className={`text-sm font-black ${textColor}`}>{pct}%</span>
      </div>
      <div className="w-full bg-mertha-bg rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict, isProcessing }) {
  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 bg-mertha-primary/10 border border-mertha-primary/30 px-4 py-2 rounded-full">
        <div className="w-4 h-4 border-2 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-black text-mertha-primary tracking-wide">
          MEMPROSES AI...
        </span>
      </div>
    );
  }

  const v = verdict || 'MENUNGGU';
  
  if (v === 'SANGAT_BAIK' || v === 'BAIK') {
    return (
      <div className="flex items-center gap-2 bg-mertha-success/10 border border-mertha-success/30 px-4 py-2 rounded-full">
        <CheckCircle2 size={18} className="text-mertha-success" />
        <span className="text-sm font-black text-mertha-success tracking-wide">
          {v === 'SANGAT_BAIK' ? 'INDIKASI SANGAT BAIK' : 'INDIKASI BAIK'}
        </span>
      </div>
    );
  }
  if (v === 'BURUK' || v === 'SANGAT_BURUK') {
    return (
      <div className="flex items-center gap-2 bg-mertha-error/10 border border-mertha-error/30 px-4 py-2 rounded-full">
        <XCircle size={18} className="text-mertha-error" />
        <span className="text-sm font-black text-mertha-error tracking-wide">
          {v === 'SANGAT_BURUK' ? 'INDIKASI SANGAT BURUK' : 'INDIKASI BURUK'}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-mertha-accent/10 border border-mertha-accent/30 px-4 py-2 rounded-full">
      <HelpCircle size={18} className="text-mertha-accent" />
      <span className="text-sm font-black text-mertha-accent tracking-wide">
        {v === 'CUKUP' ? 'INDIKASI CUKUP' : 'MENUNGGU REVIEW'}
      </span>
    </div>
  );
}

function FAQAccordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-mertha-border rounded-xl overflow-hidden mb-2 bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-4 py-3 text-left flex justify-between items-center bg-white hover:bg-mertha-bg transition-colors"
      >
        <span className="text-sm font-bold text-mertha-text">{title}</span>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ArrowLeft size={16} className="text-mertha-subtext -rotate-90" />
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0 text-xs text-mertha-subtext leading-relaxed border-t border-mertha-border/50">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AIReviewPage({ params, searchParams }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;
  // Use React.use for searchParams in Next 15
  const unwrappedSearchParams = React.use(searchParams);
  const claimId = unwrappedSearchParams.claimId;

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [refundData, setRefundData] = useState(null);
  const [daysLeft, setDaysLeft] = useState(7);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const res = await fetch(`/api/ai/food-review/result?orderId=${orderId}&userId=${user.id}`);
        if (!res.ok) { router.replace(`/pesanan/${orderId}`); return; }

        const { refund, aiReview } = await res.json();
        setRefundData(refund);

        const diffDays = Math.ceil(Math.abs(new Date() - new Date(refund.created_at)) / (1000 * 60 * 60 * 24));
        setDaysLeft(Math.max(0, 7 - diffDays));

        if (aiReview) {
          try {
            const parsedAnalysis = JSON.parse(aiReview.ai_analysis);
            setReviewData({ ...aiReview, ...parsedAnalysis });
          } catch (e) {
            setReviewData(aiReview);
          }
        } else if (claimId) {
          // If no AI review yet, but we just came from the submission page
          const storedImages = sessionStorage.getItem(`mertha_ai_images_${claimId}`);
          const storedReason = sessionStorage.getItem(`mertha_ai_reason_${claimId}`);
          
          if (storedImages && storedReason) {
            // FIX: Remove from sessionStorage immediately to prevent double fetch on refresh
            sessionStorage.removeItem(`mertha_ai_images_${claimId}`);
            sessionStorage.removeItem(`mertha_ai_reason_${claimId}`);

            setIsProcessingAI(true);
            try {
              const aiRes = await fetch('/api/ai/food-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  refundId: claimId,
                  reason: storedReason,
                  images: JSON.parse(storedImages)
                })
              });
              
              if (aiRes.ok) {
                const newAiData = await aiRes.json();
                setReviewData(newAiData);
              }

            } catch (e) {
              console.error("AI Error:", e);
            } finally {
              setIsProcessingAI(false);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderId, claimId, router, supabase]);

  if (isLoading) {
    return (
      <div className="bg-mertha-bg min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Removed full screen isProcessingAI block

  if (!reviewData && !isProcessingAI) {
    return (
      <div className="bg-mertha-bg min-h-screen flex flex-col pb-safe">
        <header className="bg-white px-4 py-3 flex items-center gap-3 border-b border-mertha-border sticky top-0 z-40">
          <button onClick={() => router.replace(`/pesanan/${orderId}`)} className="text-mertha-text">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-mertha-text">Status Refund</h1>
        </header>
        <main className="flex-1 p-4 space-y-4">
          {refundData && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-mertha-border flex items-start gap-4">
              <div className="bg-mertha-accent/10 p-3 rounded-full shrink-0">
                <Clock size={24} className="text-mertha-accent animate-pulse" />
              </div>
              <div>
                <h2 className="font-bold text-mertha-text mb-1">Menunggu Persetujuan Admin</h2>
                <p className="text-xs text-mertha-subtext leading-relaxed">
                  Komplain Anda sedang ditinjau oleh tim kami. Estimasi respons: <strong className="text-mertha-accent">{daysLeft} hari</strong> lagi.
                </p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl p-8 border border-mertha-border shadow-sm flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-mertha-bg rounded-full flex items-center justify-center mb-1">
              <ShieldAlert size={32} className="text-mertha-subtext" />
            </div>
            <p className="font-bold text-mertha-text">Analisis AI Belum Tersedia</p>
            <p className="text-xs text-mertha-subtext leading-relaxed max-w-[260px]">
              Pengajuan refund Anda sudah diterima. Hasil analisis AI akan muncul setelah sistem selesai memproses. Silakan kembali beberapa saat lagi.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const verdict = reviewData?.verdict || 'MENUNGGU';
  const edibilityScore = reviewData?.edibility_score ?? reviewData?.quality_score ?? 0;
  const freshnessScore = reviewData?.freshness_score ?? 0;
  const visualScore = reviewData?.visual_score ?? 0;
  const defectScore = reviewData?.defect_score ?? 0;

  return (
    <div className="bg-mertha-bg min-h-screen flex flex-col pb-safe">
      <header className="bg-white px-4 py-3 flex items-center gap-3 border-b border-mertha-border sticky top-0 z-40">
        <button onClick={() => router.replace(`/pesanan/${orderId}`)} className="text-mertha-text hover:bg-mertha-bg p-1 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-base font-bold text-mertha-text">Hasil Review AI</h1>
          <p className="text-[10px] text-mertha-subtext">Dianalisis oleh Mertha AI System</p>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 animate-in fade-in duration-300">

        {/* Verdict Hero Card */}
        <div className={`rounded-2xl p-6 border-2 shadow-sm text-center ${
          (verdict === 'SANGAT_BAIK' || verdict === 'BAIK') ? 'bg-mertha-success/5 border-mertha-success/30' :
          (verdict === 'BURUK' || verdict === 'SANGAT_BURUK') ? 'bg-mertha-error/5 border-mertha-error/20' :
          'bg-mertha-accent/5 border-mertha-accent/30'
        }`}>
          <div className="flex justify-center">
            <VerdictBadge verdict={verdict} isProcessing={isProcessingAI} />
          </div>
        </div>

        {/* Data Klaim */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-mertha-border">
          <h3 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Info size={16} className="text-mertha-primary" />
            Detail Klaim Anda
          </h3>
          {reviewData?.submitted_images && reviewData.submitted_images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 snap-x no-scrollbar mb-3">
              {reviewData.submitted_images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 shrink-0 snap-start">
                  <img src={img} alt="Bukti" className="w-full h-full object-cover rounded-xl border border-mertha-border" />
                </div>
              ))}
            </div>
          )}
          <div className="bg-mertha-bg p-3 rounded-xl border border-mertha-border">
            <p className="text-xs text-mertha-subtext font-semibold mb-1">Alasan Komplain:</p>
            <p className="text-xs text-mertha-text leading-relaxed">
              "{refundData?.reason || 'Tidak ada alasan'}"
            </p>
          </div>
        </div>

        {/* Skor AI — progress bars */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-mertha-border">
          <h3 className="text-sm font-bold text-mertha-text mb-1 flex items-center gap-2">
            <ShieldCheck size={16} className="text-mertha-primary" />
            Skor Analisis Visual AI
          </h3>
          <p className="text-[11px] text-mertha-subtext mb-5">Penilaian otomatis murni berdasarkan observasi visual terhadap foto komplain</p>
          <div className="space-y-6">
            <div>
              <ScoreBar label="Kelayakan Konsumsi (Edibility)" value={edibilityScore} inverted={false} />
            </div>
            <div>
              <ScoreBar label="Tingkat Kesegaran (Freshness)" value={freshnessScore} inverted={false} />
            </div>
            <div>
              <ScoreBar label="Kualitas Visual (Visual Quality)" value={visualScore} inverted={false} />
            </div>
            <div>
              <ScoreBar label="Tingkat Kerusakan (Defect Severity)" value={defectScore} inverted={true} />
            </div>
          </div>
        </div>

        {/* Proses Selanjutnya */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-mertha-border">
          <h3 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Clock size={16} className="text-mertha-accent" />
            Proses Selanjutnya
          </h3>
          <div className="space-y-3">
            {[
              { step: "1", label: "AI Selesai Analisis", done: true, desc: "Skor persentase visual dihasilkan." },
              { step: "2", label: "Review oleh Admin", done: false, desc: `Tim kami akan memverifikasi dalam ${daysLeft} hari.` },
              { step: "3", label: "Keputusan Final", done: false, desc: "Anda akan mendapatkan notifikasi hasil akhir." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${s.done ? 'bg-mertha-primary text-white' : 'bg-mertha-bg text-mertha-muted border border-mertha-border'}`}>
                  {s.done ? '✓' : s.step}
                </div>
                <div>
                  <p className={`text-xs font-bold ${s.done ? 'text-mertha-primary' : 'text-mertha-text'}`}>{s.label}</p>
                  <p className="text-[11px] text-mertha-subtext">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8">
          <h3 className="text-base font-bold text-mertha-text mb-3 px-1">Pertanyaan Seputar Refund</h3>
          <FAQAccordion title="Bagaimana cara kerja Mertha AI?">
            Mertha AI secara otomatis menganalisis foto bukti yang Anda unggah untuk mendeteksi tingkat kelayakan, kesegaran, dan kerusakan. Hasil ini akan menjadi referensi awal bagi tim admin kami.
          </FAQAccordion>
          <FAQAccordion title="Berapa lama proses persetujuan?">
            Biasanya, komplain yang memiliki skor AI yang sangat jelas (misalnya barang 100% busuk) akan disetujui dalam waktu kurang dari 24 jam. Secara umum proses memakan waktu 1-3 hari kerja.
          </FAQAccordion>
          <FAQAccordion title="Apa yang terjadi jika klaim ditolak?">
            Jika klaim ditolak, Anda tidak akan menerima pengembalian dana. Kami menyarankan Anda untuk selalu mengambil foto yang jelas dan terang sebagai bukti otentik.
          </FAQAccordion>
        </div>

      </main>
    </div>
  );
}
