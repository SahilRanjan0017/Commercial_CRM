
'use client';

import { CustomerJourneyForm } from '@/components/customer-journey-form';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AreaChart, HomeIcon, BrainCircuit, Calculator } from 'lucide-react';
import {isNullOrUndefined} from '@/utils/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ProfileLogout from '@/components/profile-logout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {

  return (
    <div className="relative h-screen w-full bg-background text-foreground flex flex-col p-4 sm:p-6 lg:p-8 gap-8">
      <Image
        src="https://images.unsplash.com/photo-1460574283810-2aab119d8511?q=80&w=1726&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Background"
        fill
        objectFit="cover"
        className="absolute inset-0 w-full h-full object-cover z-0"
        data-ai-hint="construction plans"
      />
      <div className="absolute inset-0 bg-white/20 z-0"></div>
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between gap-4">
        <Link href="/">
          <Image src="https://d2d4xyu1zrrrws.cloudfront.net/website/web-ui/assets/images/logo/bnb_logo.svg" alt="FlowTrack Logo" width={192} height={192} className="text-primary" />
        </Link>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/range-calculator">
                  <Button variant="outline">
                    <Calculator className="mr-2 h-4 w-4" />
                    Range Calculator
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Range Calculator</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/are">
                  <Button variant="outline">
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    ARE
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Asset Recommendation Engine</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Link href="/journey-360">
            <Button variant="outline">
              <AreaChart className="mr-2 h-4 w-4" />
              Journey 360
            </Button>
          </Link>
          <ProfileLogout />
        </div>
      </div>
      <main className="relative z-10 flex-grow min-h-0">
        <CustomerJourneyForm />
      </main>
      <div className="fixed bottom-8 right-8 z-20 text-sm font-semibold">
        <span className="text-black">Powered By </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span style={{ color: '#F05A29' }} className="cursor-pointer">SSD</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Syed, Sahil & Divya</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}