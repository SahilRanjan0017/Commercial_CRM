
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signup(formData: FormData) {
  const supabase = createClient()
  
  // Extract form data
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const role = formData.get('role') as string;
  const city = formData.get('city') as string;

  // Basic validation
  if (!email || !password || !full_name) {
    redirect('/signup?message=' + encodeURIComponent('Please fill in all required fields'))
  }

  try {
    const { data, error } = await supabase.auth.signUp({
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
      redirect(`/signup?message=${encodeURIComponent(error.message)}`)
    }

    // Check if user needs email confirmation
    if (data.user && !data.user.email_confirmed_at) {
      redirect(`/login?message=${encodeURIComponent("Signup successful! Please check your email to verify your account before logging in.")}`)
    } else {
      // If email confirmation is disabled, redirect to login
      redirect(`/login?message=${encodeURIComponent("Account created successfully! You can now log in.")}`)
    }
  } catch (error) {
    console.error('Unexpected signup error:', error)
    redirect('/signup?message=' + encodeURIComponent('An unexpected error occurred. Please try again.'))
  }
}

export async function login(formData: FormData) {
  const supabase = createClient()
  
  // Extract form data
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Basic validation
  if (!email || !password) {
    redirect('/login?message=' + encodeURIComponent('Email and password are required'))
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login Error:', error)
      // Provide more specific error messages based on error type
      if (error.message.includes('Invalid login credentials')) {
        redirect('/login?message=' + encodeURIComponent('Invalid email or password'))
      } else if (error.message.includes('Email not confirmed')) {
        redirect('/login?message=' + encodeURIComponent('Please check your email and confirm your account before logging in'))
      } else {
        redirect('/login?message=' + encodeURIComponent(error.message))
      }
    }

    // Check if user is authenticated
    if (!data.user) {
      redirect('/login?message=' + encodeURIComponent('Authentication failed. Please try again.'))
    }

    // Revalidate the cache for any pages that might show user data
    revalidatePath('/')
    
    // Successful login - redirect to home page
    redirect('/')
  } catch (error) {
    console.error('Unexpected login error:', error)
    redirect('/login?message=' + encodeURIComponent('An unexpected error occurred. Please try again.'))
  }
}

export async function logout() {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout Error:', error)
      redirect('/?message=' + encodeURIComponent('Error signing out'))
    }

    // Revalidate the cache
    revalidatePath('/')
    
    // Redirect to login page after logout
    redirect('/login?message=' + encodeURIComponent('You have been signed out successfully'))
  } catch (error) {
    console.error('Unexpected logout error:', error)
    redirect('/?message=' + encodeURIComponent('An unexpected error occurred during sign out'))
  }
}
