
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AreaChart, BrainCircuit, Calculator, HomeIcon, Loader2, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subMonths, startOfMonth, endOfMonth, startOfToday, endOfToday, isWithinInterval, getDate, getDaysInMonth } from 'date-fns';
import type { CustomerJourney, Task } from '@/types';
import { cn } from '@/lib/utils';
import ProfileLogout from '@/components/profile-logout';

const cityGroups: Record<string, string[]> = {
    'BLR': ['BLR', 'Bangalore', 'Blr Commercial', 'Mysore'],
    'CHN': ['CHN', 'Chennai', 'CHN Commercial'],
    'HYD': ['HYD', 'Hyderabad', 'Hyd Commercial'],
    'NCR': ['NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'NCR Commercial', 'NCR- Gurugram'],
    'Pune': ['Pune', 'Pune Commercial']
};
const cities = Object.keys(cityGroups);

const monthFilterOptions = [
    { value: 'MTD', label: 'MTD' },
    ...Array.from({ length: 8 }, (_, i) => ({
        value: `M-${i + 1}`,
        label: `M-${i + 1}`
    }))
];

const getCascadingTargets = (firstMeetingTarget: number) => {
    const recceTarget = firstMeetingTarget * 0.8 * 0.8;
    const tddmTarget = recceTarget * 0.7;
    const advanceMeetingTarget = tddmTarget * 0.4;
    const closureTarget = advanceMeetingTarget * 0.5;
    return {
        'FirstMeeting': firstMeetingTarget,
        'Recce': recceTarget,
        'TDDM': tddmTarget,
        'Advance Meeting': advanceMeetingTarget,
        'Closure': closureTarget,
    };
};

const cityFirstMeetingTargets: Record<string, number> = {
    'BLR': 50, 'CHN': 15, 'HYD': 45, 'NCR': 30, 'Pune': 10
};
const cityTargets = Object.entries(cityFirstMeetingTargets).reduce((acc, [city, firstMeetingTarget]) => {
    acc[city] = getCascadingTargets(firstMeetingTarget);
    return acc;
}, {} as Record<string, ReturnType<typeof getCascadingTargets>>);

const cityGmvTargets: Record<string, number> = {
    'BLR': 15_00_00_000, 'CHN': 5_00_00_000, 'HYD': 15_00_00_000,
    'NCR': 10_00_00_000, 'Pune': 5_00_00_000,
};
const totalTargetGmv = Object.values(cityGmvTargets).reduce((a, b) => a + b, 0);

interface CityPerformanceData {
    city: string;
    firstMeetings: { achieved: number; target: number; mtdt: number; tva: number };
    recce: { achieved: number; target: number; mtdt: number; tva: number };
    tddm: { achieved: number; target: number; mtdt: number; tva: number };
    advanceMeeting: { achieved: number; target: number; mtdt: number; tva: number };
    closure: { achieved: number; target: number; mtdt: number; tva: number };
    gmv: { quoted: number; final: number; target: number; tva: number };
}

export default function OverallViewPage() {
    const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthFilter, setMonthFilter] = useState<string>('MTD');
    const [performanceData, setPerformanceData] = useState<CityPerformanceData[] | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const res = await fetch('/api/journeys');
                if (!res.ok) throw new Error("Failed to load journeys");
                const data: CustomerJourney[] = await res.json();
                setJourneys(data);
            } catch (error) {
                console.error("Failed to load journeys:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        if (!loading && journeys.length > 0) {
            calculatePerformanceData();
        }
    }, [journeys, monthFilter, loading]);

    const calculatePerformanceData = () => {
        const getDateRangeForFilter = (filter: string): { start: Date; end: Date } => {
            const now = new Date();
            if (filter === 'MTD') return { start: startOfMonth(now), end: endOfToday() };
            const monthOffset = parseInt(filter.replace('M-', ''), 10);
            const targetMonth = subMonths(now, monthOffset);
            return { start: startOfMonth(targetMonth), end: endOfMonth(targetMonth) };
        };
        const dateRange = getDateRangeForFilter(monthFilter);
        const today = new Date();
        const monthProgressRatio = monthFilter.startsWith('M-') ? 1 : (getDate(today) / getDaysInMonth(today));

        const data: CityPerformanceData[] = cities.map(city => {
            const cityJourneys = journeys.filter(j => (cityGroups[city]?.includes(j.city) ?? false));
            
            const achievedCrns: Record<Task | 'FirstMeeting', Set<string>> = {
                'FirstMeeting': new Set<string>(), 'Recce': new Set<string>(), 'TDDM': new Set<string>(), 
                'Advance Meeting': new Set<string>(), 'Closure': new Set<string>()
            };
            
            let quotedGmv = 0;
            let finalGmv = 0;

            cityJourneys.forEach(j => {
                if (monthFilter === 'MTD' && j.current_month === true) {
                    achievedCrns.FirstMeeting.add(j.crn);
                } else if (monthFilter !== 'MTD' && j.createdAt && isWithinInterval(new Date(j.createdAt), dateRange)) {
                    achievedCrns.FirstMeeting.add(j.crn);
                }

                j.history.forEach(event => {
                    if (isWithinInterval(new Date(event.timestamp), dateRange)) {
                        if (event.stage.task === 'Recce') achievedCrns.Recce.add(j.crn);
                        if (event.stage.task === 'TDDM') achievedCrns.TDDM.add(j.crn);
                        if (event.stage.task === 'Advance Meeting') achievedCrns['Advance Meeting'].add(j.crn);
                        if (event.stage.task === 'Closure') achievedCrns.Closure.add(j.crn);
                        
                        if (event.stage.task === 'Closure' && event.stage.subTask === 'Closure Meeting (BA Collection)' && 'finalGmv' in event && event.finalGmv && event.finalGmv > 0) {
                            finalGmv += event.finalGmv;
                        }
                    }
                });

                const recceFormEventInPeriod = j.history.find(e => e.stage.subTask === 'Recce Form Submission' && isWithinInterval(new Date(e.timestamp), dateRange));
                if (recceFormEventInPeriod && j.quotedGmv && j.quotedGmv > 0) {
                    quotedGmv += j.quotedGmv;
                }
            });
            
            const achievedCounts = {
                'FirstMeeting': achievedCrns.FirstMeeting.size, 'Recce': achievedCrns.Recce.size, 'TDDM': achievedCrns.TDDM.size,
                'Advance Meeting': achievedCrns['Advance Meeting'].size, 'Closure': achievedCrns.Closure.size
            };

            const targets = cityTargets[city];
            const calcMetrics = (achieved: number, target: number) => ({
                achieved, target,
                mtdt: parseFloat((target * monthProgressRatio).toFixed(2)),
                tva: target > 0 ? parseFloat(((achieved / target) * 100).toFixed(2)) : 0,
            });

            const targetGmv = cityGmvTargets[city] || 0;

            return {
                city,
                firstMeetings: calcMetrics(achievedCounts.FirstMeeting, targets.FirstMeeting),
                recce: calcMetrics(achievedCounts['Recce'], targets.Recce),
                tddm: calcMetrics(achievedCounts['TDDM'], targets.TDDM),
                advanceMeeting: calcMetrics(achievedCounts['Advance Meeting'], targets['Advance Meeting']),
                closure: calcMetrics(achievedCounts['Closure'], targets.Closure),
                gmv: {
                    quoted: quotedGmv, final: finalGmv, target: targetGmv,
                    tva: targetGmv > 0 ? parseFloat(((quotedGmv / targetGmv) * 100).toFixed(2)) : 0,
                },
            };
        });
        setPerformanceData(data);
    };

    const grandTotal = useMemo(() => {
        if (!performanceData) return null;

        const totals: Omit<CityPerformanceData, 'city'> = {
            firstMeetings: { achieved: 0, target: 0, mtdt: 0, tva: 0 },
            recce: { achieved: 0, target: 0, mtdt: 0, tva: 0 },
            tddm: { achieved: 0, target: 0, mtdt: 0, tva: 0 },
            advanceMeeting: { achieved: 0, target: 0, mtdt: 0, tva: 0 },
            closure: { achieved: 0, target: 0, mtdt: 0, tva: 0 },
            gmv: { quoted: 0, final: 0, target: 0, tva: 0 },
        };

        performanceData.forEach(cityData => {
            (Object.keys(totals) as Array<keyof typeof totals>).forEach(key => {
                const metricKey = key as keyof typeof totals;
                if (metricKey === 'gmv') {
                    totals.gmv.quoted += cityData.gmv.quoted;
                    totals.gmv.final += cityData.gmv.final;
                    totals.gmv.target += cityData.gmv.target;
                } else {
                    const metric = totals[metricKey];
                    const cityMetric = cityData[metricKey];
                    metric.achieved += cityMetric.achieved;
                    metric.target += cityMetric.target;
                    metric.mtdt += cityMetric.mtdt;
                }
            });
        });
        
        (Object.keys(totals) as Array<keyof typeof totals>).forEach(key => {
            const metricKey = key as keyof typeof totals;
            if (metricKey !== 'gmv') {
                const metric = totals[metricKey];
                if (metric.target > 0) {
                    metric.tva = (metric.achieved / metric.target) * 100;
                } else {
                    metric.tva = 0;
                }
            }
        });
        
        if (totals.gmv.target > 0) {
            totals.gmv.tva = (totals.gmv.quoted / totals.gmv.target) * 100;
        }

        return totals;
    }, [performanceData]);

    const formatGmv = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const metricGroups = ['First Meetings', 'Recce', 'TDDM', 'Advance Meeting', 'Closure', 'GMV'];

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col p-4 sm:p-6 lg:p-8 gap-8">
            <Image
                src="https://images.unsplash.com/photo-1460574283810-2aab119d8511?q=80&w=1726&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Background"
                fill
                objectFit="cover"
                className="absolute inset-0 w-full h-full object-cover z-0"
                data-ai-hint="construction plans"
            />
            <div className="absolute inset-0 bg-white/20 z-0"></div>
            <header className="relative z-10 flex-shrink-0 flex items-center justify-between gap-4">
                <Link href="/">
                    <Image src="https://d2d4xyu1zrrrws.cloudfront.net/website/web-ui/assets/images/logo/bnb_logo.svg" alt="FlowTrack Logo" width={192} height={192} className="text-primary" />
                </Link>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/range-calculator">
                                    <Button variant="outline"><Calculator className="mr-2 h-4 w-4" />Range Calculator</Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent><p>Range Calculator</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/are">
                                    <Button variant="outline"><BrainCircuit className="mr-2 h-4 w-4" />ARE</Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent><p>Asset Recommendation Engine</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Link href="/journey-360">
                        <Button variant="outline"><AreaChart className="mr-2 h-4 w-4" />Journey 360</Button>
                    </Link>
                    <ProfileLogout />
                </div>
            </header>

            <main className="relative z-10 flex-grow min-h-0">
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Link href="/journey-360">
                                <Button variant="outline" size="icon">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <CardTitle>Overall City-wise View</CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                            <Select value={monthFilter} onValueChange={setMonthFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthFilterOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading || !performanceData ? (
                            <div className="flex justify-center items-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin"/>Loading data...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-background z-10 border-r">City</TableHead>
                                        {metricGroups.map((group, i) => (
                                            <TableHead key={group} colSpan={group === 'GMV' ? 4 : 4} className={cn("text-center", i < metricGroups.length - 1 && "border-r")}>
                                                {group}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-background z-10 border-r"></TableHead>
                                        {metricGroups.map((group, i) => (
                                            <React.Fragment key={`${group}-sub`}>
                                                <TableHead className="text-center">{group === 'GMV' ? 'Quoted' : 'Achieved'}</TableHead>
                                                <TableHead className="text-center">Target</TableHead>
                                                <TableHead className="text-center">{group === 'GMV' ? 'Final' : 'MTDT'}</TableHead>
                                                <TableHead className={cn("text-center", i < metricGroups.length - 1 && "border-r")}>TVA %</TableHead>
                                            </React.Fragment>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {performanceData.map((data) => (
                                        <TableRow key={data.city}>
                                            <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">{data.city}</TableCell>
                                            
                                            <TableCell className="text-center">{data.firstMeetings.achieved}</TableCell>
                                            <TableCell className="text-center">{data.firstMeetings.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.firstMeetings.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{data.firstMeetings.tva.toFixed(2)}%</TableCell>

                                            <TableCell className="text-center">{data.recce.achieved}</TableCell>
                                            <TableCell className="text-center">{data.recce.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.recce.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{data.recce.tva.toFixed(2)}%</TableCell>

                                            <TableCell className="text-center">{data.tddm.achieved}</TableCell>
                                            <TableCell className="text-center">{data.tddm.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.tddm.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{data.tddm.tva.toFixed(2)}%</TableCell>

                                            <TableCell className="text-center">{data.advanceMeeting.achieved}</TableCell>
                                            <TableCell className="text-center">{data.advanceMeeting.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.advanceMeeting.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{data.advanceMeeting.tva.toFixed(2)}%</TableCell>
                                            
                                            <TableCell className="text-center">{data.closure.achieved}</TableCell>
                                            <TableCell className="text-center">{data.closure.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.closure.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{data.closure.tva.toFixed(2)}%</TableCell>

                                            <TableCell className="text-center">{formatGmv(data.gmv.quoted)}</TableCell>
                                            <TableCell className="text-center">{formatGmv(data.gmv.target)}</TableCell>
                                            <TableCell className="text-center">{formatGmv(data.gmv.final)}</TableCell>
                                            <TableCell className="text-center">{data.gmv.tva.toFixed(2)}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                 {grandTotal && (
                                    <TableFooter>
                                        <TableRow className="bg-muted font-bold">
                                            <TableCell className="sticky left-0 bg-muted z-10 border-r">Grand Total</TableCell>
                                            
                                            <TableCell className="text-center">{grandTotal.firstMeetings.achieved}</TableCell>
                                            <TableCell className="text-center">{grandTotal.firstMeetings.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{grandTotal.firstMeetings.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{grandTotal.firstMeetings.tva.toFixed(2)}%</TableCell>
                                            
                                            <TableCell className="text-center">{grandTotal.recce.achieved}</TableCell>
                                            <TableCell className="text-center">{grandTotal.recce.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{grandTotal.recce.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{grandTotal.recce.tva.toFixed(2)}%</TableCell>

                                            <TableCell className="text-center">{grandTotal.tddm.achieved}</TableCell>
                                            <TableCell className="text-center">{grandTotal.tddm.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{grandTotal.tddm.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{grandTotal.tddm.tva.toFixed(2)}%</TableCell>

                                            <TableCell className="text-center">{grandTotal.advanceMeeting.achieved}</TableCell>
                                            <TableCell className="text-center">{grandTotal.advanceMeeting.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{grandTotal.advanceMeeting.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{grandTotal.advanceMeeting.tva.toFixed(2)}%</TableCell>
                                            
                                            <TableCell className="text-center">{grandTotal.closure.achieved}</TableCell>
                                            <TableCell className="text-center">{grandTotal.closure.target.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{grandTotal.closure.mtdt.toFixed(0)}</TableCell>
                                            <TableCell className="text-center border-r">{grandTotal.closure.tva.toFixed(2)}%</TableCell>

                                            <TableCell className="text-center">{formatGmv(grandTotal.gmv.quoted)}</TableCell>
                                            <TableCell className="text-center">{formatGmv(grandTotal.gmv.target)}</TableCell>
                                            <TableCell className="text-center">{formatGmv(grandTotal.gmv.final)}</TableCell>
                                            <TableCell className="text-center">{grandTotal.gmv.tva.toFixed(2)}%</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
