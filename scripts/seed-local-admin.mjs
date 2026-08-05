import { createClient } from '@supabase/supabase-js';

async function seedAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.LOCAL_ADMIN_EMAIL || 'admin123@gmail.com';
  const adminPassword = process.env.LOCAL_ADMIN_PASSWORD || 'Admin123';
  const adminName = process.env.LOCAL_ADMIN_FULL_NAME || 'Local Admin';
  const allowProd = process.env.ALLOW_PRODUCTION_SEED === 'true';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
  }

  // Basic check for prod URL safety
  if (supabaseUrl.includes('supabase.co') && !allowProd) {
    console.error('Error: Refusing to run seed against production without ALLOW_PRODUCTION_SEED=true.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`Checking for existing user with email ${adminEmail}...`);

  // We must use the Admin API to bypass RLS and create users safely without logging them in
  let { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Failed to fetch users:', usersError.message);
    process.exit(1);
  }

  let user = usersData.users.find(u => u.email === adminEmail);

  if (user) {
    console.log(`User ${adminEmail} found (ID: ${user.id}). Updating role...`);
    // Ensure email is confirmed
    if (!user.email_confirmed_at) {
      await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
    }
  } else {
    console.log(`User ${adminEmail} not found. Creating...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });
    if (createError) {
      console.error('Failed to create user:', createError.message);
      process.exit(1);
    }
    user = newUser.user;
    console.log(`Created user ${adminEmail} (ID: ${user.id}).`);
  }

  // Upsert profile with admin role
  console.log(`Upserting profile for user ${user.id}...`);
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      name: adminName,
      role: 'admin'
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Failed to update profile:', profileError.message);
    process.exit(1);
  }

  console.log('Seed completed successfully.');
}

seedAdmin().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
