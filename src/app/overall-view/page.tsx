
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AreaChart, BrainCircuit, Calculator, HomeIcon, Loader2 } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PasswordDialog } from '@/components/password-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subMonths, startOfMonth, endOfMonth, startOfToday, endOfToday, isWithinInterval, getDate, getDaysInMonth } from 'date-fns';
import type { CustomerJourney, Task } from '@/types';

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

const stageTargets: Record<Task, number> = {
    'Recce': 20,
    'TDDM': 15,
    'Advance Meeting': 10,
    'Closure': 5,
};
const targetMeetings = 40;
const targetGmv = 5_00_00_000;

interface CityPerformanceData {
    city: string;
    firstMeetings: { achieved: number; target: number; proratedTarget: number; tva: number };
    recce: { achieved: number; target: number; proratedTarget: number; tva: number };
    tddm: { achieved: number; target: number; proratedTarget: number; tva: number };
    advanceMeeting: { achieved: number; target: number; proratedTarget: number; tva: number };
    closure: { achieved: number; target: number; proratedTarget: number; tva: number };
    gmv: { quoted: number; final: number; target: number; tva: number };
}

export default function OverallViewPage() {
    const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthFilter, setMonthFilter] = useState<string>('MTD');
    const [performanceData, setPerformanceData] = useState<CityPerformanceData[]>([]);

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
        if (journeys.length > 0) {
            calculatePerformanceData();
        }
    }, [journeys, monthFilter]);

    const calculatePerformanceData = () => {
        const getDateRangeForFilter = (filter: string): { start: Date; end: Date } => {
            const now = new Date();
            if (filter === 'MTD') {
                return { start: startOfMonth(now), end: endOfToday() };
            }
            const monthOffset = parseInt(filter.replace('M-', ''), 10);
            const targetMonth = subMonths(now, monthOffset);
            return { start: startOfMonth(targetMonth), end: endOfMonth(targetMonth) };
        };
        const dateRange = getDateRangeForFilter(monthFilter);
        const today = new Date();
        const monthProgressRatio = monthFilter.startsWith('M-') ? 1 : (getDate(today) / getDaysInMonth(today));

        const data: CityPerformanceData[] = cities.map(city => {
            const cityJourneys = journeys.filter(j => 
                (cityGroups[city]?.includes(j.city) ?? false) &&
                (j.history.length > 0
                    ? j.history.some(e => isWithinInterval(new Date(e.timestamp), dateRange))
                    : j.createdAt ? isWithinInterval(new Date(j.createdAt), dateRange) : false)
            );

            let firstMeetingCount = 0;
            const stageCounts: Record<Task, number> = { 'Recce': 0, 'TDDM': 0, 'Advance Meeting': 0, 'Closure': 0 };
            let quotedGmv = 0;
            let finalGmv = 0;

            cityJourneys.forEach(j => {
                if (j.history.some(e => e.stage.subTask === 'TDDM Initial Meeting' && isWithinInterval(new Date(e.timestamp), dateRange))) {
                    firstMeetingCount++;
                }
                if (!j.isClosed) {
                    if (j.currentStage.task) {
                        stageCounts[j.currentStage.task]++;
                    }
                } else {
                    stageCounts['Closure']++;
                }
                if (j.quotedGmv && j.quotedGmv > 0) quotedGmv += j.quotedGmv;
                if (j.isClosed && j.finalGmv && j.finalGmv > 0) finalGmv += j.finalGmv;
            });
            
            const calcMetrics = (achieved: number, target: number) => ({
                achieved,
                target,
                proratedTarget: parseFloat((target * monthProgressRatio).toFixed(2)),
                tva: target > 0 ? parseFloat(((achieved / target) * 100).toFixed(2)) : 0,
            });

            return {
                city,
                firstMeetings: calcMetrics(firstMeetingCount, targetMeetings),
                recce: calcMetrics(stageCounts['Recce'], stageTargets['Recce']),
                tddm: calcMetrics(stageCounts['TDDM'], stageTargets['TDDM']),
                advanceMeeting: calcMetrics(stageCounts['Advance Meeting'], stageTargets['Advance Meeting']),
                closure: calcMetrics(stageCounts['Closure'], stageTargets['Closure']),
                gmv: {
                    quoted: quotedGmv,
                    final: finalGmv,
                    target: targetGmv,
                    tva: targetGmv > 0 ? parseFloat(((quotedGmv / targetGmv) * 100).toFixed(2)) : 0,
                },
            };
        });
        setPerformanceData(data);
    };

    const formatGmv = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground flex flex-col p-4 sm:p-6 lg:p-8 gap-8">
            <header className="flex-shrink-0 flex items-center justify-between gap-4">
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
                    <PasswordDialog href="/journey-360">
                        <Button variant="outline"><AreaChart className="mr-2 h-4 w-4" />Journey 360°</Button>
                    </PasswordDialog>
                    <Link href="/">
                        <Button variant="outline"><HomeIcon className="mr-2 h-4 w-4" />Home</Button>
                    </Link>
                </div>
            </header>

            <main className="flex-grow min-h-0">
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>Overall City-wise View</CardTitle>
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
                        {loading ? (
                            <div className="flex justify-center items-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin"/>Loading data...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-background z-10">City</TableHead>
                                        <TableHead colSpan={4} className="text-center">First Meetings</TableHead>
                                        <TableHead colSpan={4} className="text-center">Recce</TableHead>
                                        <TableHead colSpan={4} className="text-center">TDDM</TableHead>
                                        <TableHead colSpan={4} className="text-center">Advance Meeting</TableHead>
                                        <TableHead colSpan={4} className="text-center">Closure</TableHead>
                                        <TableHead colSpan={4} className="text-center">GMV</TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                                        {Array(6).fill(0).map((_, i) => (
                                            <>
                                                <TableHead key={`achieved-${i}`} className="text-center">Achieved</TableHead>
                                                <TableHead key={`target-${i}`} className="text-center">Target</TableHead>
                                                <TableHead key={`mtdt-${i}`} className="text-center">Prorated</TableHead>
                                                <TableHead key={`tva-${i}`} className="text-center">TVA %</TableHead>
                                            </>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {performanceData.map((data) => (
                                        <TableRow key={data.city}>
                                            <TableCell className="font-medium sticky left-0 bg-background z-10">{data.city}</TableCell>
                                            
                                            <TableCell className="text-center">{data.firstMeetings.achieved}</TableCell>
                                            <TableCell className="text-center">{data.firstMeetings.target}</TableCell>
                                            <TableCell className="text-center">{data.firstMeetings.proratedTarget.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.firstMeetings.tva}%</TableCell>

                                            <TableCell className="text-center">{data.recce.achieved}</TableCell>
                                            <TableCell className="text-center">{data.recce.target}</TableCell>
                                            <TableCell className="text-center">{data.recce.proratedTarget.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.recce.tva}%</TableCell>

                                            <TableCell className="text-center">{data.tddm.achieved}</TableCell>
                                            <TableCell className="text-center">{data.tddm.target}</TableCell>
                                            <TableCell className="text-center">{data.tddm.proratedTarget.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.tddm.tva}%</TableCell>

                                            <TableCell className="text-center">{data.advanceMeeting.achieved}</TableCell>
                                            <TableCell className="text-center">{data.advanceMeeting.target}</TableCell>
                                            <TableCell className="text-center">{data.advanceMeeting.proratedTarget.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.advanceMeeting.tva}%</TableCell>
                                            
                                            <TableCell className="text-center">{data.closure.achieved}</TableCell>
                                            <TableCell className="text-center">{data.closure.target}</TableCell>
                                            <TableCell className="text-center">{data.closure.proratedTarget.toFixed(0)}</TableCell>
                                            <TableCell className="text-center">{data.closure.tva}%</TableCell>

                                            <TableCell className="text-center">{formatGmv(data.gmv.quoted)}</TableCell>
                                            <TableCell className="text-center">{formatGmv(data.gmv.target)}</TableCell>
                                            <TableCell className="text-center">{formatGmv(data.gmv.final)}</TableCell>
                                            <TableCell className="text-center">{data.gmv.tva}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

