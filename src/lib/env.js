import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.warn("⚠️ Invalid or missing environment variables:", parsed.error.format());
    // In a strict environment, we might throw here. 
    // For this demo, we'll just warn so it doesn't crash without .env
  }
  
  return parsed.data;
}

export const env = validateEnv();
