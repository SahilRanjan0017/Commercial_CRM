
"use client";

import { signup } from "../login/actions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function SignupPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const roles = ["OS", "Business Head", "Admin"];
  const cities = ["BLR", "CHN", "HYD", "PUNE", "NCR"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle className="text-3xl">Sign Up</CardTitle>
            <CardDescription>
                Enter your information to create an account
            </CardDescription>
        </CardHeader>
        <CardContent>
            {message && (
            <p className="mb-4 rounded bg-red-100 p-3 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {message}
            </p>
            )}

            <form action={signup} className="space-y-4">
                <div>
                    <Label htmlFor="full_name">Name</Label>
                    <Input
                        id="full_name"
                        type="text"
                        name="full_name"
                        placeholder="Sahil Ranjan"
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="sahil.ranjan@bricknbolt.com"
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="•••••••••"
                        required
                    />
                </div>
                
                <div>
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
                
                <div>
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

            <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
            </Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
