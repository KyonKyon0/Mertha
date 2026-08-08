'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }
  
  // Track Login
  try {
    await supabase.from('login_logs').insert({
       user_id: authData.user?.id,
       email: data.email,
       ip_address: formData.get('ip_address') || 'Unknown',
       location_lat: formData.get('location_lat') ? parseFloat(formData.get('location_lat')) : null,
       location_lng: formData.get('location_lng') ? parseFloat(formData.get('location_lng')) : null,
       device_meta: formData.get('device_meta') || 'Unknown'
    });
  } catch (err) {
    console.error("Failed to log tracking data", err);
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
    options: {
      data: {
        full_name: formData.get('name'),
      }
    }
  }

  const { error, data: authData } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // Create profile
  if (authData.user) {
    await supabase.from('profiles').insert({
      id: authData.user.id,
      name: formData.get('name'),
      phone: formData.get('phone') || null
    })
    
    // Track Signup
    try {
      await supabase.from('login_logs').insert({
         user_id: authData.user.id,
         email: data.email,
         ip_address: formData.get('ip_address') || 'Unknown',
         location_lat: formData.get('location_lat') ? parseFloat(formData.get('location_lat')) : null,
         location_lng: formData.get('location_lng') ? parseFloat(formData.get('location_lng')) : null,
         device_meta: formData.get('device_meta') || 'Unknown'
      });
    } catch (err) {
      console.error("Failed to log tracking data", err);
    }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Cek email Anda untuk verifikasi akun')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(formData) {
  const supabase = await createClient()
  const email = formData.get('email')
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
  })
  
  if (error) {
    return { error: error.message }
  }
  return { success: 'Link reset password telah dikirim ke email Anda' }
}
