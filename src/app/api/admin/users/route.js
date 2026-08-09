import { createClient } from '@supabase/supabase-js';
import { withLogging } from '@/lib/logger';

export async function POST(req) {
  return withLogging(req, async (request) => {
    try {
      const { action, userId, role, adminEmail } = await request.json();

      if (!adminEmail || adminEmail !== 'oss.tam1137@gmail.com') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
      }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (action === 'update_role') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'delete_user') {
      // 1. Delete from auth.users (this cascades to profiles if fk is set up)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      // 2. Fallback delete from profiles just in case
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      
      if (authError && !authError.message.includes('not found')) {
        throw authError;
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  });
}
