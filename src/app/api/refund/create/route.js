import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { orderId, userId, reason } = await request.json();

    if (!orderId || !userId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert Refund (service role)
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

    return NextResponse.json({ success: true, refundId: refundData.id });

  } catch (error) {
    console.error("Refund Create Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
