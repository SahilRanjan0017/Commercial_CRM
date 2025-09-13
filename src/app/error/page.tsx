'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
      <h1 className="text-4xl font-bold text-destructive mb-4">Something went wrong</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {message || "We're sorry, but an unexpected error occurred. Please try again later."}
      </p>
      <Button asChild>
        <Link href="/">Go back to Home</Link>
      </Button>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading error page...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
