
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const roles = ["OS", "Business Head"];
  const cities = ["BLR", "CHN", "HYD", "PUNE", "NCR"];

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
           <div className="grid gap-2 text-center">
             <Link href="/" className="flex justify-center">
                <Image src="https://d2d4xyu1zrrrws.cloudfront.net/website/web-ui/assets/images/logo/bnb_logo.svg" alt="FlowTrack Logo" width={192} height={192} className="text-primary" />
            </Link>
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to create an account
            </p>
          </div>

          {message && (
            <p className="rounded bg-red-100 p-3 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {message}
            </p>
          )}

          <form action="/api/auth/signup" method="POST" className="grid gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="full_name">Name</Label>
                  <Input
                      id="full_name"
                      type="text"
                      name="full_name"
                      placeholder="Sahil Ranjan"
                      required
                  />
              </div>

              <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="sahil.ranjan@bricknbolt.com"
                      required
                  />
              </div>

              <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                      id="password"
                      type="password"
                      name="password"
                      placeholder="•••••••••"
                      required
                  />
              </div>
              
              <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required>
                      <SelectTrigger id="role">
                          <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                          {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                              {role}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              
              <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Select name="city" required>
                      <SelectTrigger id="city">
                          <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                          {cities.map((city) => (
                              <SelectItem key={city} value={city}>
                              {city}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>

              <Button type="submit" className="w-full">
                  Create an account
              </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
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
    </div>
  );
}
