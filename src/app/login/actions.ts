
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const role = formData.get('role') as string;
  const city = formData.get('city') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
        data: { 
            full_name: full_name,
            role: role,
            city: city
        } 
    }
  })

  if (error) {
    console.error('Signup Error:', error)
    // Redirect with the actual error message from Supabase for better debugging
    return redirect(`/signup?message=${encodeURIComponent(error.message)}`)
  }

  // After successful signup, redirect to login page with a success message
  return redirect(`/login?message=${encodeURIComponent("Signup successful! Please check your email to verify your account before logging in.")}`)
}

export async function login(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?message=Invalid credentials')
  }

  redirect('/')
}
