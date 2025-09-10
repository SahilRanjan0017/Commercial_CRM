
'use client';

import type { StageEvent, Task } from '@/types';
import { tasks, stageMap } from '@/types';
import { Milestone, ClipboardCheck, Handshake, CheckCircle2, Lock, Rocket, FileText, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';

const taskStyles: Record<Task, { icon: React.ElementType, color: string, bgColor: string }> = {
    'Recce': { icon: Milestone, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
    'TDDM': { icon: ClipboardCheck, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
    'Advance Meeting': { icon: Handshake, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/50' },
    'Closure': { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
};

interface HorizontalJourneyViewProps {
  history: StageEvent[];
  isClosed: boolean;
}

export function HorizontalJourneyView({ history, isClosed }: HorizontalJourneyViewProps) {
  const groupedHistory = history.reduce((acc, event) => {
    const task = event.stage.task;
    if (!acc[task]) acc[task] = [];
    acc[task].push(event);
    return acc;
  }, {} as Record<string, StageEvent[]>);

  let completedTasksCount = 0;
  for (const task of tasks) {
    const events = groupedHistory[task] || [];
    if(events.length === stageMap[task].length) {
        completedTasksCount++;
    }
  }

  if (isClosed) {
    completedTasksCount = tasks.length;
  }
  
  const progressPercentage = tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0;

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        <div className="relative w-full h-2 bg-muted rounded-full">
            <div 
                className={cn(
                    "absolute top-0 left-0 h-2 rounded-full transition-all duration-500",
                    isClosed ? "bg-green-600" : "bg-primary"
                )}
                style={{ width: `${progressPercentage}%`}}
            ></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {tasks.map((task) => {
            const events = groupedHistory[task] || [];
            const isTaskActive = events.length > 0;
            const isTaskComplete = events.length === stageMap[task].length || (isClosed && task !== tasks[tasks.length -1]);
            const isJourneyClosedComplete = isClosed && task === tasks[tasks.length -1];
            
            const stageStatus = isJourneyClosedComplete || isTaskComplete ? 'complete' : isTaskActive ? 'inProgress' : 'pending';

            const statusStyles = {
                complete: 'border-green-600 bg-green-500/10',
                inProgress: 'border-yellow-500 bg-yellow-500/10',
                pending: 'border-border bg-muted/50 opacity-60'
            }

            const TaskIcon = taskStyles[task].icon;

            return (
              <Tooltip key={task} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className={cn(
                      "p-4 rounded-lg border-2 flex flex-col items-center justify-center text-center space-y-2 transition-all",
                      statusStyles[stageStatus]
                  )}>
                    <TaskIcon className={cn("w-8 h-8", taskStyles[task].color)} />
                    <p className="font-semibold text-sm sm:text-base">{task}</p>
                     <p className="text-xs text-muted-foreground">
                        {events.length} / {stageMap[task].length} steps
                    </p>
                  </div>
                </TooltipTrigger>
                {isTaskActive && (
                  <TooltipContent className="p-4 max-w-sm w-full">
                    <ScrollArea className="max-h-60">
                        <h4 className="font-bold text-lg mb-2">{task} Events</h4>
                        <div className="space-y-4">
                            {events.map(event => (
                                <div key={event.id} className="text-xs">
                                    <p className="font-semibold text-sm flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        {event.stage.subTask}
                                    </p>
                                    <div className="text-muted-foreground flex items-center gap-4 mt-1 pl-6">
                                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {format(new Date(event.timestamp), "PPp")}</span>
                                        <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {event.user}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
