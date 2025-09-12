
import { login } from './actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://i.postimg.cc/NMVQQKY6/bnb.avif"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint="building construction"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <Link href="/" className="flex justify-center">
                <Image src="https://d2d4xyu1zrrrws.cloudfront.net/website/web-ui/assets/images/logo/bnb_logo.svg" alt="FlowTrack Logo" width={192} height={192} className="text-primary" />
            </Link>
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <form action={login} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            {searchParams?.message && (
              <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center text-sm">
                {searchParams.message}
              </p>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
