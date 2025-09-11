
'use client';

import { useEffect, useState, useTransition } from 'react';
import type { CustomerJourney, StageRef, Task, SubTask, TDDMInitialMeetingData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StageForms } from '@/components/stage-forms';
import { TimelineView } from '@/components/timeline-view';
import { stageMap, tasks } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';


export function CustomerJourneyForm() {
  const [journey, setJourney] = useState<CustomerJourney | null>(null);
  const [crnInput, setCrnInput] = useState('');
  const [currentStagePreview, setCurrentStagePreview] = useState<StageRef | null>(null);
  const [loading, setLoading] = useState(false);
  const [crnExists, setCrnExists] = useState<boolean | null>(null);
  const [isCheckingCrn, startCrnCheck] = useTransition();
  const { toast } = useToast();
  
  const handleCrnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCrn = e.target.value.toUpperCase();
    setCrnInput(newCrn);
    setCurrentStagePreview(null);
    setCrnExists(null);
  }

  const handleCrnBlur = () => {
    if (crnInput.trim()) {
      startCrnCheck(async () => {
        try {
            const res = await fetch(`/api/journeys/${crnInput.trim()}`);
            if (res.status === 404) {
                setCrnExists(false);
                setCurrentStagePreview(null);
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch stage');
            const stage = await res.json();
            setCurrentStagePreview(stage);
            setCrnExists(true);
        } catch (error) {
            console.error("CRN check failed:", error);
            setCrnExists(false);
            setCurrentStagePreview(null);
        }
      })
    }
  }

  const handleCrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crnExists) {
        toast({
            variant: "destructive",
            title: "CRN Not Found",
            description: "This CRN does not exist. Please enter a valid CRN.",
        });
        return;
    }

    if (crnInput.trim()) {
      setLoading(true);
      try {
        const res = await fetch(`/api/journeys/${crnInput.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Body is now empty
        });
        if (!res.ok) throw new Error('Could not load journey');
        const loadedJourney = await res.json();
        setJourney(loadedJourney);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load journey. Check the CRN or see console for details.",
        })
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTaskChange = (newTask: Task) => {
    if(journey && !journey.isClosed){
        const newSubTask = stageMap[newTask][0];
        setJourney(prev => prev ? {...prev, currentStage: { ...prev.currentStage, task: newTask, subTask: newSubTask } } : null);
    }
  }

  const handleSubTaskChange = (newSubTask: SubTask) => {
      if(journey && !journey.isClosed){
          setJourney(prev => prev ? {...prev, currentStage: {...prev.currentStage, subTask: newSubTask } } : null);
      }
  }

  const handleUpdateJourney = async (stageData: any) => {
    if (!journey) return;
    
    setLoading(true);

    const newHistory = [...journey.history, stageData];
    
    const currentTask = journey.currentStage.task;
    const currentSubTask = journey.currentStage.subTask;

    const subTaskArray = stageMap[currentTask];
    const currentSubTaskIndex = subTaskArray.indexOf(currentSubTask);
    
    let nextStage: Omit<StageRef, 'crn'>;
    let isClosing = false;

    if (currentSubTaskIndex < subTaskArray.length - 1) {
        nextStage = { task: currentTask, subTask: subTaskArray[currentSubTaskIndex + 1], city: journey.city };
    } else {
        const currentTaskIndex = tasks.indexOf(currentTask);
        if (currentTaskIndex < tasks.length - 1) {
            const nextTask = tasks[currentTaskIndex + 1];
            nextStage = { task: nextTask, subTask: stageMap[nextTask][0], city: journey.city };
        } else {
            nextStage = journey.currentStage;
            isClosing = true;
        }
    }

    const updatedJourney: CustomerJourney = {
      ...journey,
      history: newHistory,
      currentStage: nextStage,
      isClosed: isClosing,
    };

    try {
      const updateRes = await fetch(`/api/journeys/${journey.crn}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedJourney)
      });

      if (!updateRes.ok) throw new Error('Failed to update journey');


      if (stageData.stage.subTask === 'TDDM Initial Meeting') {
          const tddmData = stageData as TDDMInitialMeetingData;
          try {
            await fetch('/api/webhooks/tddm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...tddmData,
                    customerName: journey.customerName,
                    customerEmail: journey.customerEmail,
                    customerPhone: journey.customerPhone
                })
            });
            toast({
              title: "TDDM Webhook Sent",
              description: "The meeting details have been sent to the webhook.",
            });
          } catch(webhookError) {
             console.error("Webhook sending error:", webhookError);
             toast({
                variant: "destructive",
                title: "Webhook Error",
                description: "Journey updated, but failed to send TDDM webhook. See console for details.",
             });
          }
      }

      setJourney(updatedJourney);
      toast({
        title: "Success",
        description: `Journey ${isClosing ? 'closed' : 'updated'} successfully.`,
      })
    } catch (error: any) {
       console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Could not update journey. See console for details.",
        })
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoBack = () => {
    setJourney(null);
    setCrnInput('');
    setCurrentStagePreview(null);
    setCrnExists(null);
  };
  
  const availableSubTasks = journey?.currentStage?.task ? stageMap[journey.currentStage.task] : [];

  if (!journey) {
    return (
        <div className='flex items-center justify-center h-full'>
            <Card className="max-w-lg w-full">
                <CardHeader>
                <CardTitle>Enter Your CRN Number</CardTitle>
                <CardDescription>Enter the CRN to view or update the customer journey.</CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleCrnSubmit} className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="crn">CRN</Label>
                    <Input
                        id="crn"
                        placeholder="e.g., CRN12345"
                        value={crnInput}
                        onChange={handleCrnChange}
                        onBlur={handleCrnBlur}
                    />
                    </div>
                    {isCheckingCrn && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</div>}
                    
                    {crnExists === true && currentStagePreview && !isCheckingCrn && (
                        <div className="text-sm font-medium p-3 bg-secondary/20 text-secondary-foreground rounded-md">
                            <span className="text-muted-foreground">Current Stage:</span> {currentStagePreview.task} - {currentStagePreview.subTask}
                        </div>
                    )}
                    
                    {crnExists === false && !isCheckingCrn && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>CRN Not Found</AlertTitle>
                            <AlertDescription>This customer does not exist. Please enter a valid CRN.</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading || isCheckingCrn || crnExists === false}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Load Journey
                    </Button>
                </form>
                </CardContent>
            </Card>
        </div>
    );
  } else {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start h-full">
        <div className="lg:col-span-2 space-y-6 h-full flex flex-col">
          <Card className='flex-grow flex flex-col'>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className='flex items-center gap-4'>
                     <Button variant="outline" size="icon" onClick={handleGoBack} className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                     </Button>
                     <div>
                        <CardTitle>Current Stage: {journey.currentStage.task} - {journey.currentStage.subTask}</CardTitle>
                        <CardDescription>CRN: {journey.crn} | City: {journey.city}</CardDescription>
                     </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                    <div>
                        <Label>Task</Label>
                        <Select value={journey.currentStage.task} onValueChange={handleTaskChange} disabled={journey.isClosed}>
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select task" />
                          </SelectTrigger>
                          <SelectContent>
                            {tasks.map(task => (
                              <SelectItem key={task} value={task}>{task}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    <div>
                      <Label>Sub-Task</Label>
                       <Select value={journey.currentStage.subTask} onValueChange={handleSubTaskChange} disabled={journey.isClosed}>
                          <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder="Select sub-task" />
                          </SelectTrigger>
                          <SelectContent>
                             {availableSubTasks && availableSubTasks.map(subTask => (
                              <SelectItem key={subTask} value={subTask}>{subTask}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                  </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              {journey.isClosed ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/50 rounded-lg">
                      <Lock className="w-16 h-16 text-primary mb-4" />
                      <h3 className="text-2xl font-bold">Journey Closed</h3>
                      <p className="text-muted-foreground mt-2 max-w-prose">This customer journey has been marked as complete and can no longer be edited.</p>
                      <p className="text-primary mt-4 font-medium italic max-w-prose">"Your dedication, follow-ups, and commitment made this deal happen. Every closure like this takes us one step closer to our bigger goals."</p>
                  </div>
              ) : (
                  <StageForms 
                    currentStage={journey.currentStage}
                    onSubmit={handleUpdateJourney}
                    journey={journey}
                    isSubmitting={loading}
                  />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 h-full min-h-0">
          <TimelineView history={journey.history} isClosed={journey.isClosed} />
        </div>
      </div>
    );
  }
}
