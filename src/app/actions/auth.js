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

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
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
