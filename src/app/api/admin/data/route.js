import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (adminEmail !== 'admin@gmail.com') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 1. Fetch Logs
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('login_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // 2. Fetch Profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('name');

    // 3. Fetch Merchants
    const { data: merchants, error: merchantsError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .order('name');

    // 4. Fetch Products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*, merchants(name)')
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;
    if (profilesError) throw profilesError;

    return NextResponse.json({
      logs: logs || [],
      profiles: profiles || [],
      merchants: merchants || [],
      products: products || []
    });

  } catch (error) {
    console.error("Admin Data Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
