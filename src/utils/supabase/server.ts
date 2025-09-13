import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): any {
          cookieStore.then((res)=>{
            return res.getAll();
          }).catch((err)=> {
            return err;
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.then((res)=> res.set(name, value, options)).catch((err)=>{
              console.log("Error while setting the cookies.. ", err)
            })
          )
        },
      },
    }
  )
}
