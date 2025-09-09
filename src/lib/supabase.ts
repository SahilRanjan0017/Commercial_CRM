
import { createBrowserClient } from '@supabase/ssr';

// This is the client-side-only Supabase client.
// It is safe to use in client components.
export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
