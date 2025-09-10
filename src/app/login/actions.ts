'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { 
        full_name: name,
        role: role
    } }
  })

  if (error) {
    console.error('Signup Error:', error)
    return redirect('/signup?message=Could not authenticate user')
  }

  // After successful signup, redirect to login page with a success message
  return redirect('/login?message=Check email to continue sign in process')
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

  redirect('/private')
}
