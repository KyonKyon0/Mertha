"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ShieldAlert, CheckCircle2, XCircle, AlertOctagon, Info, Lightbulb, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';
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

function VerdictBadge({ verdict }) {
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

export default function AIReviewPage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;

  const [isLoading, setIsLoading] = useState(true);
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
            // We stored the full JSON in the ai_analysis column to bypass schema limitations
            const parsedAnalysis = JSON.parse(aiReview.ai_analysis);
            setReviewData({
              ...aiReview,
              ...parsedAnalysis
            });
          } catch (e) {
            // Fallback for old data
            setReviewData(aiReview);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderId, router, supabase]);

  if (isLoading) {
    return (
      <div className="bg-mertha-bg min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!reviewData) {
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

  const qualityPct = Math.round((reviewData.quality_score || 0) * 100);
  const verdict = reviewData.verdict || 'MENUNGGU';
  const recommendations = reviewData.recommendations || [];
  const warnings = reviewData.warnings || [];
  const verdictReason = reviewData.verdict_reason || '';

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
          <div className="flex justify-center mb-3">
            <VerdictBadge verdict={verdict} />
          </div>
          {verdictReason && (
            <p className="text-sm font-medium text-mertha-text leading-relaxed mt-2">{verdictReason}</p>
          )}
        </div>

        {/* Skor AI — progress bars */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-mertha-border">
          <h3 className="text-sm font-bold text-mertha-text mb-1 flex items-center gap-2">
            <ShieldCheck size={16} className="text-mertha-primary" />
            Skor Analisis AI
          </h3>
          <p className="text-[11px] text-mertha-subtext mb-4">Hasil penilaian otomatis berdasarkan keluhan yang diberikan</p>
          <div className="space-y-4">
            <div>
              <ScoreBar label="Skor Kelayakan Konsumsi" value={reviewData.quality_score || 0} inverted={false} />
              <p className="text-[10px] text-mertha-subtext mt-1">
                {qualityPct < 40 ? "Kualitas sangat rendah — ada kemungkinan makanan tidak layak konsumsi." :
                 qualityPct < 70 ? "Kualitas menurun — ada indikasi penurunan kualitas dari seharusnya." :
                 "Kualitas baik — makanan dilaporkan masih dalam kondisi layak."}
              </p>
            </div>
          </div>
        </div>

        {/* Analisis Lengkap */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-mertha-border">
          <h3 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Info size={16} className="text-blue-500" />
            Analisis Lengkap AI
          </h3>
          <p className="text-sm text-mertha-subtext leading-relaxed">{reviewData.ai_analysis}</p>
        </div>

        {/* Rekomendasi */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-mertha-border">
            <h3 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-mertha-accent" />
              Saran dari AI
            </h3>
            <div className="space-y-2">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight size={14} className="text-mertha-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-mertha-subtext leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proses Selanjutnya */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-mertha-border">
          <h3 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Clock size={16} className="text-mertha-accent" />
            Proses Selanjutnya
          </h3>
          <div className="space-y-3">
            {[
              { step: "1", label: "AI Selesai Analisis", done: true, desc: "Skor dan temuan sudah dihasilkan." },
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

        {/* Peringatan Kualitas Buruk */}
        {warnings.length > 0 && (
          <div className="bg-mertha-error/5 border border-mertha-error/20 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-mertha-error mb-2 flex items-center gap-2">
              <AlertOctagon size={14} /> Peringatan Sistem
            </h4>
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-mertha-error/80 leading-relaxed">• {w}</p>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
