
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AreaChart, HomeIcon, BrainCircuit, Calculator } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AreForm } from '@/components/are-form';

export default function ArePage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col p-4 sm:p-6 lg:p-8 gap-8">
      <header className="relative z-10 flex-shrink-0 flex items-center justify-between gap-4">
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
                Journey 360°
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
        </div>
      </header>
      <main className="relative z-10 flex-grow min-h-0">
        <AreForm />
      </main>
    </div>
  );
}
