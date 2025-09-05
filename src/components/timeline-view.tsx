
'use client';

import { FileText, Calendar, Clock, User, Milestone, ClipboardCheck, Handshake, CheckCircle2, Lock, Rocket } from 'lucide-react';
import type { StageEvent, Task } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface TimelineViewProps {
  history: StageEvent[];
  isClosed: boolean;
}

const taskStyles: Record<Task, { icon: React.ElementType, color: string }> = {
    'Recce': { icon: Milestone, color: 'bg-blue-500/10 border-blue-500 text-blue-600' },
    'TDDM': { icon: ClipboardCheck, color: 'bg-purple-500/10 border-purple-500 text-purple-600' },
    'Advance Meeting': { icon: Handshake, color: 'bg-orange-500/10 border-orange-500 text-orange-600' },
    'Closure': { icon: CheckCircle2, color: 'bg-green-500/10 border-green-500 text-green-600' },
};


export function TimelineView({ history, isClosed }: TimelineViewProps) {
  if (history.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Journey Timeline</CardTitle>
          <CardDescription>No history yet. Start by completing the first stage.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">The customer's journey will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  const groupedHistory = history.reduce((acc, event) => {
    const task = event.stage.task;
    if (!acc[task]) {
      acc[task] = [];
    }
    acc[task].push(event);
    return acc;
  }, {} as Record<string, StageEvent[]>);

  const lastEvent = history.length > 0 ? history[history.length - 1] : null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Journey Timeline</CardTitle>
                <CardDescription>A complete history of the customer journey.</CardDescription>
            </div>
            {isClosed && (
                <Badge variant="destructive" className="flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Closed
                </Badge>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
            <div className="relative border-l-2 border-border ml-4 space-y-8">
                 {isClosed && (
                    <div className="relative pl-8 py-4">
                        <div className={`absolute -left-[42px] top-5 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary`}>
                            <Rocket className={`w-4 h-4 text-primary`} />
                        </div>
                        <p className={`font-semibold text-primary`}>
                            Journey with BNB Started
                        </p>
                         <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1 mb-2">
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {format(new Date(history[0].timestamp), "PPp")}</span>
                         </div>
                    </div>
                )}
                <Accordion type="multiple" defaultValue={Object.keys(groupedHistory)} className="w-full">
                {Object.entries(groupedHistory).map(([task, events]) => {
                    const TaskIcon = taskStyles[task as Task]?.icon || FileText;
                    const taskColor = taskStyles[task as Task]?.color || 'bg-gray-500/10 border-gray-500 text-gray-600';

                    return (
                    <AccordionItem value={task} key={task} className="border-b-0">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline -ml-4 py-0">
                        <div className="relative w-full">
                            <div className="absolute -left-[34px] top-1/2 -translate-y-1/2 h-full w-[2px] bg-border"></div>
                             <div className="flex items-center gap-3 pl-8 py-4">
                                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', taskColor)}>
                                        <TaskIcon className="h-5 w-5" />
                                </div>
                                <span>{task}</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="pl-8 py-4 space-y-8">
                        
                        {events.map((event, index) => {
                            const isCurrent = lastEvent ? event.id === lastEvent.id : false;
                            const stageTitle = event.stage.subTask;
                            const stageExtra = 'followUpNumber' in event ? `#${event.followUpNumber}` : 'negotiationNumber' in event ? `#${event.negotiationNumber}` : '';

                            return (
                            <div key={event.id} className="relative">
                                <div className={`absolute -left-[66px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 ${isCurrent && !isClosed ? 'border-primary' : 'border-border'}`}>
                                <FileText className={`w-4 h-4 ${isCurrent && !isClosed ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                
                                <p className={`font-semibold ${isCurrent && !isClosed ? 'text-primary' : 'text-card-foreground'}`}>
                                    {stageTitle}{' '}{stageExtra}
                                </p>
                                <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1 mb-2">
                                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {format(new Date(event.timestamp), "PPp")}</span>
                                    <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {event.user}</span>
                                </div>
                                
                                {event.nextStepBrief && <p className={`text-sm mt-2 p-3 rounded-md bg-muted/50 border`}>{event.nextStepBrief}</p>}
                                
                                {event.nextStepEta && (
                                    <Badge variant="outline" className="mt-2 text-xs">
                                        <Calendar className="w-3 h-3 mr-1.5" /> Next Step ETA: {format(new Date(event.nextStepEta), "PPP")}
                                    </Badge>
                                )}
                            
                            </div>
                            );
                        })}
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                )})}
                </Accordion>
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
