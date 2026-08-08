import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, password, name, phone, ip_address, location_lat, location_lng, device_meta } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Create user using admin API (bypasses rate limits and email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm email so they can login immediately
      user_metadata: { full_name: name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert into profiles
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        name: name,
        phone: phone || null
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
      
      // 3. Track Signup
      try {
        await supabaseAdmin.from('login_logs').insert({
          user_id: authData.user.id,
          email: email,
          ip_address: ip_address || 'Unknown',
          location_lat: location_lat ? parseFloat(location_lat) : null,
          location_lng: location_lng ? parseFloat(location_lng) : null,
          device_meta: device_meta || 'Unknown'
        });
      } catch (err) {
        console.error("Failed to log tracking data", err);
      }
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
