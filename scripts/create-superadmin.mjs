import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  const email = 'oss.tam1137@gmail.com';
  const password = 'OscarAdmin123';
  const name = 'Oscar (Super Admin)';

  console.log(`Creating super admin: ${email}`);

  // 1. Create or get user from Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  let userId;

  if (authError) {
    if (authError.message.includes('already exists') || authError.message.includes('Email exists')) {
      console.log('User already exists in auth. Fetching user ID...');
      const { data: { users }, error: getError } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        userId = existingUser.id;
        // Update password just to be sure
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      } else {
        console.error('Failed to fetch existing user:', getError);
        return;
      }
    } else {
      console.error('Auth Error:', authError.message);
      return;
    }
  } else {
    userId = authData.user.id;
    console.log('User created in Auth.');
  }

  // 2. Ensure profile exists and set role to super_admin
  console.log(`Updating profile for user ${userId}...`);
  
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existingProfile) {
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name: name,
        role: 'super_admin'
      });
      
    if (insertError) {
      console.error('Error inserting profile:', insertError.message);
    } else {
      console.log('Profile created with super_admin role.');
    }
  } else {
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating profile role:', updateError.message);
    } else {
      console.log('Profile role updated to super_admin.');
    }
  }
  
  console.log('Done.');
}

createSuperAdmin();
