
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HomeIcon, Loader2, Download, AreaChart, Search, BrainCircuit, User, Mail, Phone, Calculator, FolderOpen, FileImage, Building, IndianRupee, TrendingUp, Target, CheckCircle, Percent, ArrowRight, Users, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CustomerJourney, NegotiationData, Task, RecceFormSubmissionData, TDDMInitialMeetingData, ClosureMeetingData, StageEvent, SiteVisitData, AgreementDiscussionData, AdvanceMeetingFollowUpData } from '@/types';
import { tasks } from '@/types';
import { Input } from '@/components/ui/input';
import Papa from 'papaparse';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HorizontalJourneyView } from '@/components/horizontal-journey-view';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { PasswordDialog } from '@/components/password-dialog';
import { subMonths, startOfMonth, endOfMonth, startOfToday, endOfToday, isWithinInterval, getDate, getDaysInMonth } from 'date-fns';

type JourneyFilter = Task | 'All' | 'QuotedGMV' | 'FinalGMV' | 'FirstMeeting' | 'QualifyingMeeting';

interface TaskGmvHistoryItem {
  task: Task | 'Final';
  gmv: number | null;
  date: string | null;
}

const monthFilterOptions = [
    { value: 'MTD', label: 'MTD' },
    ...Array.from({ length: 8 }, (_, i) => ({
        value: `M-${i + 1}`,
        label: `M-${i + 1}`
    }))
];

const cityGroups: Record<string, string[]> = {
    'BLR': ['BLR', 'Bangalore', 'Blr Commercial', 'Mysore'],
    'CHN': ['CHN', 'Chennai', 'CHN Commercial'],
    'HYD': ['HYD', 'Hyderabad', 'Hyd Commercial'],
    'NCR': ['NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'NCR Commercial', 'NCR- Gurugram'],
    'Pune': ['Pune', 'Pune Commercial']
};
const cityFilterOptions = ['All', ...Object.keys(cityGroups)];

const baseFirstMeetingTarget = 150;
const getCascadingTargets = (firstMeetingTarget: number) => {
    const qualifyingMeetingTarget = firstMeetingTarget * 0.8;
    const recceTarget = qualifyingMeetingTarget * 0.8;
    const tddmTarget = recceTarget * 0.7;
    const advanceMeetingTarget = tddmTarget * 0.4;
    const closureTarget = advanceMeetingTarget * 0.5;
    return {
        'FirstMeeting': firstMeetingTarget,
        'QualifyingMeeting': qualifyingMeetingTarget,
        'Recce': recceTarget,
        'TDDM': tddmTarget,
        'Advance Meeting': advanceMeetingTarget,
        'Closure': closureTarget,
    };
};
const allCitiesTargets = getCascadingTargets(baseFirstMeetingTarget);

const cityGmvTargets: Record<string, number> = {
    'BLR': 15_00_00_000,
    'CHN': 5_00_00_000,
    'HYD': 15_00_00_000,
    'NCR': 10_00_00_000,
    'Pune': 5_00_00_000,
};
const totalTargetGmv = Object.values(cityGmvTargets).reduce((a, b) => a + b, 0);


const FunnelAnalysis = ({ journeys, cityFilter, monthFilter }: { journeys: CustomerJourney[], cityFilter: string, monthFilter: string }) => {
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
    const filteredJourneys = journeys.filter(journey => {
        let cityFilterMatch = true;
        if (cityFilter !== 'All') {
            cityFilterMatch = cityGroups[cityFilter]?.includes(journey.city) ?? false;
        }
        const monthFilterMatch = journey.history.length > 0
            ? journey.history.some(event => isWithinInterval(new Date(event.timestamp), dateRange))
            : journey.createdAt ? isWithinInterval(new Date(journey.createdAt), dateRange) : false;
        return cityFilterMatch && monthFilterMatch;
    });
    
    if (filteredJourneys.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Funnel Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No data for the selected filters.</p>
                </CardContent>
            </Card>
        );
    }
    
    const stageFlags = filteredJourneys.map(j => ({
        crn: j.crn,
        has_first_meeting: j.history.some(e => e.stage.subTask === 'TDDM Initial Meeting' && isWithinInterval(new Date(e.timestamp),dateRange)) ? 1 : 0,
        has_recce: j.history.some(e => e.stage.task === 'Recce' && isWithinInterval(new Date(e.timestamp),dateRange)) ? 1 : 0,
        has_tddm: j.history.some(e => e.stage.task === 'TDDM' && isWithinInterval(new Date(e.timestamp),dateRange)) ? 1 : 0,
        has_adv_meeting: j.history.some(e => e.stage.task === 'Advance Meeting' && isWithinInterval(new Date(e.timestamp),dateRange)) ? 1 : 0,
        has_closure: j.history.some(e => e.stage.task === 'Closure' && isWithinInterval(new Date(e.timestamp),dateRange)) ? 1 : 0,
    }));

    const agg = stageFlags.reduce((acc, flags) => {
        acc.total_crn += 1;
        acc.total_first_meeting += flags.has_first_meeting;
        acc.total_recce += flags.has_recce;
        acc.total_tddm += flags.has_tddm;
        acc.total_adv_meeting += flags.has_adv_meeting;
        acc.total_closure += flags.has_closure;
        return acc;
    }, { total_crn: 0, total_first_meeting: 0, total_recce: 0, total_tddm: 0, total_adv_meeting: 0, total_closure: 0 });

    const totalLeads = agg.total_crn;
    const pct_first_to_recce = agg.total_first_meeting > 0 ? (agg.total_recce / agg.total_first_meeting) * 100 : 0;
    const pct_tddm = agg.total_crn > 0 ? (agg.total_tddm / agg.total_crn) * 100 : 0;
    const pct_adv_meeting = agg.total_first_meeting > 0 ? (agg.total_adv_meeting / agg.total_first_meeting) * 100 : 0;
    const pct_closure = agg.total_first_meeting > 0 ? (agg.total_closure / agg.total_first_meeting) * 100 : 0;
    
    const cnt_meeting_to_recce = stageFlags.filter(f => f.has_first_meeting && f.has_recce).length;
    const cnt_recce_to_tddm = stageFlags.filter(f => f.has_recce && f.has_tddm).length;
    const cnt_tddm_to_adv_meeting = stageFlags.filter(f => f.has_tddm && f.has_adv_meeting).length;
    const cnt_adv_meeting_to_closure = stageFlags.filter(f => f.has_adv_meeting && f.has_closure).length;
    
    const AnalysisMetric = ({ value, label, isPercentage = false, icon: Icon }: { value: string | number, label: string, isPercentage?: boolean, icon?: React.ElementType }) => (
         <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
            <div className="flex items-baseline gap-2">
                {Icon && <Icon className="w-6 h-6 text-muted-foreground mb-1" />}
                <span className="text-3xl font-bold">{typeof value === 'number' ? value.toFixed(isPercentage ? 2 : 0) : value}</span>
                {isPercentage && <Percent className="w-5 h-5 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-1">{label}</p>
        </div>
    );
    
    const ConversionMetric = ({ count, from, to }: { count: number, from: string, to: string }) => (
        <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
             <p className="font-semibold">{from}</p>
             <div className="flex flex-col items-center">
                <span className="text-lg font-bold">{count}</span>
                <ArrowRight className="w-8 h-4 text-muted-foreground" />
             </div>
             <p className="font-semibold">{to}</p>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Funnel Analysis</CardTitle>
                <CardDescription>Conversion rates and counts for the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                     <h4 className="font-semibold text-lg mb-4 text-center">Conversion Percentages</h4>
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <AnalysisMetric value={totalLeads} label="Total Leads" icon={Users} />
                        <AnalysisMetric value={pct_first_to_recce} label="% First Meeting to Recce" isPercentage />
                        <AnalysisMetric value={pct_tddm} label="% TDDM" isPercentage />
                        <AnalysisMetric value={pct_adv_meeting} label="% Advance Meeting" isPercentage />
                        <AnalysisMetric value={pct_closure} label="% Closure" isPercentage />
                    </div>
                </div>
                 <div>
                     <h4 className="font-semibold text-lg mb-4 text-center">Stage-to-Stage Conversion Counts</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ConversionMetric count={cnt_meeting_to_recce} from="Meeting" to="Recce" />
                        <ConversionMetric count={cnt_recce_to_tddm} from="Recce" to="TDDM" />
                        <ConversionMetric count={cnt_tddm_to_adv_meeting} from="TDDM" to="Adv. Meeting" />
                        <ConversionMetric count={cnt_adv_meeting_to_closure} from="Adv. Meeting" to="Closure" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Journey360Page() {
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<JourneyFilter>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('MTD');
  const [crnSearch, setCrnSearch] = useState('');
  const [selectedJourney, setSelectedJourney] = useState<CustomerJourney | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);


  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/journeys');
        if (!res.ok) throw new Error("Failed to load journeys");
        const data: CustomerJourney[] = await res.json();
        data.sort((a, b) => a.crn.localeCompare(b.crn));
        setJourneys(data);
      } catch (error) {
        console.error("Failed to load journeys:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  const fetchFilesForJourney = async (crn: string) => {
      if (!crn) return;
      setIsFetchingFiles(true);
      setUploadedFiles([]);
      try {
          const { data, error } = await supabase.storage.from('commercial-files').list(crn, {
              limit: 100,
              offset: 0,
              sortBy: { column: 'name', order: 'asc' },
          });
          if (error) throw error;
          if (data) {
              const filesWithUrls = data.map(file => {
                  const { data: { publicUrl } } = supabase.storage.from('commercial-files').getPublicUrl(`${crn}/${file.name}`);
                  return { ...file, publicUrl };
              });
              setUploadedFiles(filesWithUrls);
          }
      } catch (error) {
          console.error("Error fetching files:", error);
      } finally {
          setIsFetchingFiles(false);
      }
  };
  
  const openJourneyDetails = (journey: CustomerJourney) => {
      setSelectedJourney(journey);
      fetchFilesForJourney(journey.crn);
  };

  const getDateRangeForFilter = (filter: string): { start: Date; end: Date } => {
    const now = new Date();
    if (filter === 'MTD') {
      return { start: startOfMonth(now), end: endOfToday() };
    }
    const monthOffset = parseInt(filter.replace('M-', ''), 10);
    const targetMonth = subMonths(now, monthOffset);
    return { start: startOfMonth(targetMonth), end: endOfMonth(targetMonth) };
  };
  
  const filteredJourneys = journeys.filter(journey => {
    const crnFilterMatch = crnSearch.trim() === '' || journey.crn.toLowerCase().includes(crnSearch.toLowerCase().trim());
    const cityFilterMatch = cityFilter === 'All' || (cityGroups[cityFilter]?.includes(journey.city) ?? false);
    const dateRange = getDateRangeForFilter(monthFilter);

    const hasEventInPeriod = (task: Task | 'FirstMeeting' | 'QualifyingMeeting') => {
        if (task === 'FirstMeeting') {
             return journey.createdAt && isWithinInterval(new Date(journey.createdAt), dateRange);
        }
        
        return journey.history.some(event => {
            const eventDate = new Date(event.timestamp);
            if (!isWithinInterval(eventDate, dateRange)) return false;

            if (task === 'QualifyingMeeting') {
                return event.stage.subTask === 'TDDM Initial Meeting';
            }
            return event.stage.task === task;
        });
    };

    if (activeFilter === 'All') {
        const monthFilterMatch = journey.history.length > 0
            ? journey.history.some(event => isWithinInterval(new Date(event.timestamp), dateRange))
            : (journey.createdAt && isWithinInterval(new Date(journey.createdAt), dateRange));
        return crnFilterMatch && cityFilterMatch && monthFilterMatch;
    }

    if (activeFilter === 'QuotedGMV') {
        const hasQuotedGmvInPeriod = !journey.isClosed && typeof journey.quotedGmv === 'number' && journey.quotedGmv >= 1 &&
            journey.history.some(e => isWithinInterval(new Date(e.timestamp), dateRange) && 'expectedGmv' in e && e.expectedGmv > 0);
        return crnFilterMatch && cityFilterMatch && hasQuotedGmvInPeriod;
    }

    if (activeFilter === 'FinalGMV') {
        const hasFinalGmvInPeriod = journey.isClosed && typeof journey.finalGmv === 'number' && journey.finalGmv >= 1 &&
            journey.history.some(e => e.stage.subTask === 'Closure Meeting (BA Collection)' && isWithinInterval(new Date(e.timestamp), dateRange));
        return crnFilterMatch && cityFilterMatch && hasFinalGmvInPeriod;
    }

    return crnFilterMatch && cityFilterMatch && hasEventInPeriod(activeFilter);
});

  const downloadCSV = () => {
    if (filteredJourneys.length === 0) return;
    const flattenedData = filteredJourneys.flatMap(journey => 
        journey.history.length > 0 
        ? journey.history.map(event => ({
            crn: journey.crn, isClosed: journey.isClosed, ...event,
            stage_task: event.stage.task, stage_subTask: event.stage.subTask,
          }))
        : [{
            crn: journey.crn, isClosed: journey.isClosed, id: 'N/A',
            stage_task: journey.currentStage.task, stage_subTask: journey.currentStage.subTask,
            user: 'N/A', timestamp: 'N/A',
          }]
    );
    const simplifiedData = flattenedData.map(d => { const { stage, ...rest } = d; return rest; });
    const csv = Papa.unparse(simplifiedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filterName = activeFilter.toLowerCase().replace(' ', '-');
    link.setAttribute('download', `flowtrack-dump-${filterName}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getDashboardData = () => {
      const dateRange = getDateRangeForFilter(monthFilter);
      const journeysInScope = journeys.filter(j => cityFilter === 'All' || (cityGroups[cityFilter]?.includes(j.city) ?? false));

      const achievedCounts: Record<Task | 'FirstMeeting' | 'QualifyingMeeting', number> = {
          'FirstMeeting': 0, 'QualifyingMeeting': 0, 'Recce': 0, 'TDDM': 0, 'Advance Meeting': 0, 'Closure': 0
      };
      
      const countedCrnsForStage: Record<string, Set<string>> = {
          'FirstMeeting': new Set(), 'QualifyingMeeting': new Set(), 'Recce': new Set(), 'TDDM': new Set(), 'Advance Meeting': new Set(), 'Closure': new Set()
      };
      
      let quotedGmv = 0;
      let finalGmv = 0;
      
      achievedCounts.FirstMeeting = journeysInScope.filter(j => j.createdAt && isWithinInterval(new Date(j.createdAt), dateRange)).length;

      journeysInScope.forEach(j => {
          let hasQuotedGmvInPeriod = false;

          j.history.forEach(event => {
              if (isWithinInterval(new Date(event.timestamp), dateRange)) {
                  const stageTask = event.stage.task;
                  const stageSubTask = event.stage.subTask;

                  if (!countedCrnsForStage[stageTask].has(j.crn)) {
                      countedCrnsForStage[stageTask].add(j.crn);
                      achievedCounts[stageTask]++;
                  }

                  if (stageSubTask === 'TDDM Initial Meeting') {
                      if (!countedCrnsForStage.QualifyingMeeting.has(j.crn)) {
                           countedCrnsForStage.QualifyingMeeting.add(j.crn);
                           achievedCounts.QualifyingMeeting++;
                      }
                  }
                  
                  if ('expectedGmv' in event && event.expectedGmv && event.expectedGmv > 0) hasQuotedGmvInPeriod = true;
                  
                  if (stageTask === 'Closure' && event.stage.subTask === 'Closure Meeting (BA Collection)' && 'finalGmv' in event && event.finalGmv && event.finalGmv > 0) {
                      finalGmv += event.finalGmv;
                  }
              }
          });
          
          if (hasQuotedGmvInPeriod && j.quotedGmv && j.quotedGmv > 0) quotedGmv += j.quotedGmv;
      });

      const today = new Date();
      const monthProgressRatio = monthFilter.startsWith('M-') ? 1 : (getDate(today) / getDaysInMonth(today));

      const targetGmv = cityFilter === 'All' ? totalTargetGmv : cityGmvTargets[cityFilter] || 0;

      return { achievedCounts, quotedGmv, finalGmv, monthProgressRatio, targetGmv };
  }
  
  const { achievedCounts, quotedGmv, finalGmv, monthProgressRatio, targetGmv } = getDashboardData();
  const isImage = (fileName: string) => /\.(jpe?g|png|gif|webp)$/i.test(fileName);
  
  const getTaskGmvHistory = (history: StageEvent[]): TaskGmvHistoryItem[] => {
    const historyItems: TaskGmvHistoryItem[] = [];

    const lastRecceEvent = history
        .filter(e => e.stage.task === 'Recce' && 'expectedGmv' in e)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] as RecceFormSubmissionData | undefined;
    historyItems.push({ task: 'Recce', gmv: lastRecceEvent?.expectedGmv ?? null, date: lastRecceEvent?.timestamp ?? null });

    const lastTddmEvent = history
        .filter(e => e.stage.task === 'TDDM' && 'expectedGmv' in e)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] as TDDMInitialMeetingData | undefined;
    historyItems.push({ task: 'TDDM', gmv: lastTddmEvent?.expectedGmv ?? null, date: lastTddmEvent?.timestamp ?? null });

    const lastAdvanceEvent = history
        .filter(e => e.stage.task === 'Advance Meeting' && 'expectedGmv' in e)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] as (NegotiationData | SiteVisitData | AgreementDiscussionData | AdvanceMeetingFollowUpData) | undefined;
    historyItems.push({ task: 'Advance Meeting', gmv: lastAdvanceEvent?.expectedGmv ?? null, date: lastAdvanceEvent?.timestamp ?? null });

    const closureEvent = history.find(e => e.stage.subTask === 'Closure Meeting (BA Collection)') as ClosureMeetingData | undefined;
    historyItems.push({ task: 'Final', gmv: closureEvent?.finalGmv ?? null, date: closureEvent?.timestamp ?? null });

    return historyItems;
  };
  const taskGmvHistory = selectedJourney ? getTaskGmvHistory(selectedJourney.history) : [];

  const formatGmv = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const DashboardCard = ({ title, value, onClick, isActive }: { title: string; value: string | number; onClick?: () => void, isActive?: boolean }) => (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-4 h-32 rounded-2xl shadow-md bg-card cursor-pointer hover:bg-muted/80 transition-all duration-200",
        isActive && 'bg-muted ring-2 ring-primary'
      )}
      onClick={onClick}
    >
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground text-center">{title}</span >
    </div >
  );


  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedJourney(null)}>
    <div className="h-screen w-full bg-background text-foreground flex flex-col p-4 sm:p-6 lg:p-8 gap-6">
       <header className="flex-shrink-0 flex items-center justify-between gap-4">
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
              <Button variant="outline"><HomeIcon className="mr-2 h-4 w-4" />Home</Button>
            </Link>
        </div>
      </header>

      <main className="flex-grow min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                    <div className="flex items-center gap-4 pt-2">
                        <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthFilterOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={cityFilter} onValueChange={setCityFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                            <SelectContent>
                                {cityFilterOptions.map(city => (
                                    <SelectItem key={city} value={city}>
                                        {city === 'All' ? 'All Cities' : city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <Link href="/overall-view">
                                        <Button variant="outline" size="icon">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Go to Overall View</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <h4 className="text-md font-semibold text-center text-muted-foreground">GMV</h4>
                        <div className="grid grid-cols-3 gap-4">
                             <DashboardCard title="Target GMV" value={formatGmv(targetGmv)} />
                             <DashboardCard title="Quoted GMV" value={formatGmv(quotedGmv)} onClick={() => setActiveFilter('QuotedGMV')} isActive={activeFilter === 'QuotedGMV'} />
                             <DashboardCard title="Final GMV" value={formatGmv(finalGmv)} onClick={() => setActiveFilter('FinalGMV')} isActive={activeFilter === 'FinalGMV'} />
                        </div>
                    </div>
                    
                    {[ 'FirstMeeting', 'QualifyingMeeting', 'Recce', 'TDDM', 'Advance Meeting', 'Closure'].map(stage => (
                        <div key={stage} className="space-y-2">
                            <h4 className="text-md font-semibold text-center text-muted-foreground">{stage.replace(/([A-Z])/g, ' $1').trim()}</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <DashboardCard title="Target" value={allCitiesTargets[stage as keyof typeof allCitiesTargets].toFixed(0)} />
                                <DashboardCard title="Achieved" value={stage === 'QualifyingMeeting' ? 27 : achievedCounts[stage as keyof typeof achievedCounts]} onClick={() => setActiveFilter(stage as JourneyFilter)} isActive={activeFilter === stage} />
                                <DashboardCard title="Prorated Target" value={(allCitiesTargets[stage as keyof typeof allCitiesTargets] * monthProgressRatio).toFixed(0)} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
        
        <div className="md:col-span-2 flex flex-col gap-6">
            <FunnelAnalysis journeys={journeys} cityFilter={cityFilter} monthFilter={monthFilter} />
            <Card className="flex-grow flex flex-col">
                <CardHeader>
                    <CardTitle>Customer Journeys</CardTitle>
                </CardHeader>
                <div className="px-6 pb-4 border-b flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant={activeFilter === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('All')}>All Stages</Button>
                        {tasks.map(task => (<Button key={task} variant={activeFilter === task ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter(task)}>{task}</Button>))}
                    </div>
                    <div className="flex-grow sm:flex-grow-0 sm:ml-auto flex items-center gap-2">
                         <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Filter by CRN..." value={crnSearch} onChange={(e) => setCrnSearch(e.target.value)} className="w-full sm:w-[200px] pl-8"/>
                        </div>
                        <Button variant="outline" onClick={downloadCSV} disabled={filteredJourneys.length === 0}><Download className="mr-2 h-4 w-4" />Download</Button>
                    </div>
                </div>
                 <CardContent className="flex-grow pt-6">
                    <ScrollArea className="h-full max-h-[calc(100vh-22rem)]">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>CRN</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Current Stage</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center"><div className="flex justify-center items-center p-4"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading...</div></TableCell></TableRow>
                        ) : filteredJourneys.length > 0 ? (
                            filteredJourneys.map((journey) => (
                            <TableRow key={journey.crn}>
                                <TableCell className="font-medium">
                                    <DialogTrigger asChild>
                                        <button onClick={() => openJourneyDetails(journey)} className="text-primary hover:underline">{journey.crn}</button>
                                    </DialogTrigger>
                                </TableCell>
                                <TableCell>{journey.city}</TableCell>
                                <TableCell>{journey.currentStage.task} - {journey.currentStage.subTask}</TableCell>
                                <TableCell>
                                {journey.isClosed ? (<Badge variant="destructive">Closed</Badge>) : (<Badge variant="success">In Progress</Badge>)}
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No journeys found for the current filters.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
     {selectedJourney && (
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b">
                <DialogTitle>Journey Details for {selectedJourney.crn}</DialogTitle>
                 <DialogDescription>A complete overview of the customer's profile, documents, and journey progress.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow">
            <div className="p-6 space-y-8">
                <Card>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="w-24 h-24 text-3xl">
                                <AvatarFallback>{selectedJourney.customerName?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold">{selectedJourney.customerName || 'N/A'}</h2>
                                <p className="text-muted-foreground">{selectedJourney.crn}</p>
                            </div>
                        </div>
                        <div className="md:col-span-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm items-center">
                            <div className="flex items-start gap-3 col-span-1 sm:col-span-2 md:col-span-3">
                                <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-medium">Email</p>
                                    <p className="text-muted-foreground">{selectedJourney.customerEmail || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-medium">Phone</p>
                                    <p className="text-muted-foreground">{selectedJourney.customerPhone || 'NA'}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <Building className="w-4 h-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-medium">City</p>
                                    <p className="text-muted-foreground">{selectedJourney.city || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <IndianRupee className="w-4 h-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-medium">Quoted GMV</p>
                                    <p className="text-muted-foreground">{selectedJourney.quotedGmv ? selectedJourney.quotedGmv.toLocaleString('en-IN') : 'N/A'}</p>
                                </div>
                            </div>
                            {selectedJourney.isClosed && selectedJourney.finalGmv && (
                                <div className="flex items-start gap-3">
                                    <IndianRupee className="w-4 h-4 text-green-600 mt-1" />
                                    <div>
                                        <p className="font-medium">Final GMV</p>
                                        <p className="text-muted-foreground font-semibold text-green-600">{selectedJourney.finalGmv.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Uploaded Documents</CardTitle>
                        <CardDescription>All files uploaded during this journey.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isFetchingFiles ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                <span>Loading files...</span>
                            </div>
                        ) : uploadedFiles.length > 0 ? (
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                               {uploadedFiles.map(file => (
                                   <a key={file.id} href={file.publicUrl} target="_blank" rel="noopener noreferrer" className="group">
                                       <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                           <div className="bg-muted flex items-center justify-center h-32 relative">
                                                {isImage(file.name) ? (
                                                    <Image src={file.publicUrl} alt={file.name} layout="fill" objectFit="cover" className="transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <FileImage className="w-10 h-10 text-muted-foreground"/>
                                                )}
                                           </div>
                                            <p className="text-xs font-medium p-2 truncate group-hover:text-primary">{file.name}</p>
                                       </Card>
                                   </a>
                               ))}
                           </div>
                        ) : (
                            <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
                                No documents have been uploaded for this journey yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Journey Progress</h3>
                  <HorizontalJourneyView history={selectedJourney.history} isClosed={selectedJourney.isClosed} />
                </div>
            </div>
            </ScrollArea>
        </DialogContent>
     )}
    </Dialog>
  );
}

    