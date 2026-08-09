import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function withLogging(req, handler) {
  const start = performance.now();
  const method = req.method;
  const url = new URL(req.url);
  const endpoint = url.pathname;
  
  let statusCode = 500;
  try {
    const res = await handler(req);
    statusCode = res.status;
    const end = performance.now();
    const duration = Math.round(end - start);
    
    // Fire and forget log insertion
    supabase.from('api_logs').insert({
      method,
      endpoint,
      status_code: statusCode,
      duration_ms: duration
    }).then();
    
    return res;
  } catch (error) {
    const end = performance.now();
    const duration = Math.round(end - start);
    
    supabase.from('api_logs').insert({
      method,
      endpoint,
      status_code: 500,
      duration_ms: duration
    }).then();
    
    throw error;
  }
}
