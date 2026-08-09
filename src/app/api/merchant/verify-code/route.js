import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { codeStr, merchantId } = await request.json();
    
    if (!codeStr || !merchantId) {
      return NextResponse.json({ error: 'Kode dan Merchant ID harus diisi.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('pickup_code', codeStr.trim().toUpperCase())
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Kode tidak valid atau tidak ditemukan.' }, { status: 404 });
    }

    if (order.status === 'completed') {
      return NextResponse.json({ error: 'Pesanan ini sudah diselesaikan sebelumnya.' }, { status: 400 });
    }

    if (order.status === 'cancelled' || order.status === 'refunded') {
      return NextResponse.json({ error: `Pesanan ini dibatalkan atau di-refund (${order.status}).` }, { status: 400 });
    }

    // Update to completed
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: 'Gagal mengupdate status pesanan.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil! Pesanan #${order.id.substring(0,6).toUpperCase()} selesai.`,
      order
    });

  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
