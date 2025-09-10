import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function PrivatePage() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const { data: userDetails } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome!</h1>
        <p className="text-lg text-muted-foreground mb-2">
            You are successfully logged in as <span className="font-semibold text-primary">{data.user.email}</span>.
        </p>
         {userDetails && (
            <p className="text-md text-muted-foreground mb-8">
                Your role is <span className="font-semibold">{userDetails.role}</span> and your city is <span className="font-semibold">{userDetails.city}</span>.
            </p>
        )}
        <Button asChild>
            <Link href="/">Go to Home</Link>
        </Button>
    </div>
    )
}
