import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withLogging } from '@/lib/logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  return withLogging(request, async (req) => {
    try {
      const adminEmail = req.headers.get('x-admin-email');
    if (adminEmail !== 'oss.tam1137@gmail.com') {
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

    // 5. Fetch Orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // 6. Fetch API Logs
    const { data: api_logs, error: apiLogsError } = await supabaseAdmin
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) throw logsError;
    if (profilesError) throw profilesError;
    if (merchantsError) throw merchantsError;
    if (productsError) throw productsError;
    if (ordersError) throw ordersError;
    if (apiLogsError) throw apiLogsError;

    return NextResponse.json({
      logs: logs || [],
      profiles: profiles || [],
      merchants: merchants || [],
      products: products || [],
      orders: orders || [],
      api_logs: api_logs || []
    });

    } catch (error) {
      console.error("Admin Data Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}
