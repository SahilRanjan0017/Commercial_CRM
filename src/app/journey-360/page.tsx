
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HomeIcon, Loader2, Download, AreaChart, Search, BrainCircuit, User, Mail, Phone, Calculator, FolderOpen, FileImage, Building, IndianRupee } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CustomerJourney, NegotiationData, Task, RecceFormSubmissionData, TDDMInitialMeetingData, ClosureMeetingData, StageEvent, SiteVisitData, AgreementDiscussionData, AdvanceMeetingFollowUpData } from '@/types';
import { tasks } from '@/types';
import { Input } from '@/components/ui/input';
import Papa from 'papaparse';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HorizontalJourneyView } from '@/components/horizontal-journey-view';
import { FunnelChart } from '@/components/funnel-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { areCities } from '@/lib/are-logic';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PasswordDialog } from '@/components/password-dialog';

type JourneyFilter = Task | 'All' | 'QuotedGMV' | 'FinalGMV';

interface TaskGmvHistoryItem {
  task: Task | 'Final';
  gmv: number | null;
  date: string | null;
}


export default function Journey360Page() {
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<JourneyFilter>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
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
  
  const filteredJourneys = journeys.filter(journey => {
      const crnFilterMatch = crnSearch.trim() === '' || journey.crn.toLowerCase().includes(crnSearch.toLowerCase().trim());
      const cityFilterMatch = cityFilter === 'All' || journey.city === cityFilter;

      let statusFilterMatch = true;
      if (activeFilter === 'All') {
          statusFilterMatch = true;
      } else if (activeFilter === 'QuotedGMV') {
          statusFilterMatch = !journey.isClosed && typeof journey.quotedGmv === 'number' && journey.quotedGmv >= 1;
      } else if (activeFilter === 'FinalGMV') {
          statusFilterMatch = journey.isClosed && typeof journey.finalGmv === 'number' && journey.finalGmv >= 1;
      } else {
          statusFilterMatch = journey.currentStage.task === activeFilter;
      }

      return statusFilterMatch && crnFilterMatch && cityFilterMatch;
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
      const journeysToCount = cityFilter === 'All' ? journeys : journeys.filter(j => j.city === cityFilter);
      
      const counts = tasks.reduce((acc, task) => ({...acc, [task]: 0}), {} as Record<Task, number>);
      let quotedGmv = 0;
      let finalGmv = 0;

      journeysToCount.forEach(j => {
          if(!j.isClosed) {
              if(j.currentStage.task) {
                  counts[j.currentStage.task]++;
              }
              if (j.quotedGmv && j.quotedGmv > 0) {
                quotedGmv += j.quotedGmv;
              }
          } else {
              if (j.finalGmv && j.finalGmv > 0) {
                finalGmv += j.finalGmv;
              }
          }
      });
      const stageCounts = tasks.map(task => ({ stage: task, count: counts[task] }));

      return { stageCounts, quotedGmv, finalGmv };
  }
  
  const { stageCounts, quotedGmv, finalGmv } = getDashboardData();
  const isImage = (fileName: string) => /\.(jpe?g|png|gif|webp)$/i.test(fileName);
  
  const getTaskGmvHistory = (history: StageEvent[]): TaskGmvHistoryItem[] => {
    const historyItems: TaskGmvHistoryItem[] = [];

    // Recce
    const lastRecceEvent = history
        .filter(e => e.stage.task === 'Recce' && 'expectedGmv' in e)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] as RecceFormSubmissionData | undefined;
    historyItems.push({ task: 'Recce', gmv: lastRecceEvent?.expectedGmv ?? null, date: lastRecceEvent?.timestamp ?? null });

    // TDDM
    const lastTddmEvent = history
        .filter(e => e.stage.task === 'TDDM' && 'expectedGmv' in e)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] as TDDMInitialMeetingData | undefined;
    historyItems.push({ task: 'TDDM', gmv: lastTddmEvent?.expectedGmv ?? null, date: lastTddmEvent?.timestamp ?? null });

    // Advance Meeting
    const lastAdvanceEvent = history
        .filter(e => e.stage.task === 'Advance Meeting' && 'expectedGmv' in e)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] as (NegotiationData | SiteVisitData | AgreementDiscussionData | AdvanceMeetingFollowUpData) | undefined;
    historyItems.push({ task: 'Advance Meeting', gmv: lastAdvanceEvent?.expectedGmv ?? null, date: lastAdvanceEvent?.timestamp ?? null });

    // Final
    const closureEvent = history.find(e => e.stage.subTask === 'Closure Meeting (BA Collection)') as ClosureMeetingData | undefined;
    historyItems.push({ task: 'Final', gmv: closureEvent?.finalGmv ?? null, date: closureEvent?.timestamp ?? null });

    return historyItems;
  };
  const taskGmvHistory = selectedJourney ? getTaskGmvHistory(selectedJourney.history) : [];

  const formatGmv = (value: number) => {
    if (value >= 1_00_00_000) {
        return `${(value / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (value >= 1_00_000) {
        return `${(value / 1_00_000).toFixed(2)} L`;
    }
    return value.toLocaleString('en-IN');
  };


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
                  <PasswordDialog href="/range-calculator">
                    <Button variant="outline">
                      <Calculator className="mr-2 h-4 w-4" />
                      Range Calculator
                    </Button>
                  </PasswordDialog>
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
            <PasswordDialog href="/journey-360">
              <Button variant="outline">
                <AreaChart className="mr-2 h-4 w-4" />
                Journey 360°
              </Button>
            </PasswordDialog>
            <Link href="/">
              <Button variant="outline"><HomeIcon className="mr-2 h-4 w-4" />Home</Button>
            </Link>
        </div>
      </header>

      <main className="flex-grow min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Dashboard</CardTitle>
                         <Select value={cityFilter} onValueChange={setCityFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Cities</SelectItem>
                                {areCities.map(city => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Card
                      className={cn(
                        "p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted",
                        activeFilter === 'QuotedGMV' && 'bg-muted ring-2 ring-primary'
                      )}
                      onClick={() => setActiveFilter('QuotedGMV')}
                    >
                        <p className="text-2xl font-bold">{formatGmv(quotedGmv)}</p>
                        <p className="text-sm text-muted-foreground">Quoted GMV</p>
                    </Card>
                     <Card
                      className={cn(
                        "p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted",
                        activeFilter === 'FinalGMV' && 'bg-muted ring-2 ring-primary'
                      )}
                      onClick={() => setActiveFilter('FinalGMV')}
                     >
                        <p className="text-2xl font-bold">{formatGmv(finalGmv)}</p>
                        <p className="text-sm text-muted-foreground">Final GMV</p>
                    </Card>
                    {stageCounts.map(item => (
                        <Card key={item.stage} className="p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted" onClick={() => setActiveFilter(item.stage)}>
                            <p className="text-3xl font-bold">{item.count}</p>
                            <p className="text-sm text-muted-foreground">{item.stage}</p>
                        </Card>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Customer Journey Funnel</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                    <FunnelChart data={stageCounts} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                </CardContent>
            </Card>
        </div>
        
        <div className="md:col-span-2 flex flex-col">
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
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="w-24 h-24 text-3xl">
                                <AvatarFallback>{selectedJourney.customerName?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold">{selectedJourney.customerName || 'N/A'}</h2>
                                <p className="text-muted-foreground">{selectedJourney.crn}</p>
                            </div>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm items-center">
                            <div className="flex items-start gap-3">
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
                                    <p className="font-medium">Initial GMV</p>
                                    <p className="text-muted-foreground">{selectedJourney.gmv ? selectedJourney.gmv.toLocaleString('en-IN') : 'N/A'}</p>
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
                        <CardTitle>Task GMV History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>GMV</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {taskGmvHistory.length > 0 ? (
                                    taskGmvHistory.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.task === 'Final' ? 'Final GMV' : `${item.task} (Expected GMV)`}</TableCell>
                                            <TableCell>{typeof item.gmv === 'number' ? item.gmv.toLocaleString('en-IN') : 'N/A'}</TableCell>
                                            <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No GMV history available.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
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
