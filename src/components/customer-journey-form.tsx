
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
import { getJourney, getStageForCrn, updateJourney } from '@/services/supabase';
import { sendTDDMWebhook } from '@/services/webhook';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { Badge } from './ui/badge';
import {areCities} from '@/lib/are-logic';

export function CustomerJourneyForm() {
  const [journey, setJourney] = useState<CustomerJourney | null>(null);
  const [crnInput, setCrnInput] = useState('');
  const [city, setCity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gmv, setGmv] = useState('');

  const [currentStagePreview, setCurrentStagePreview] = useState<StageRef | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingStage, startStageCheck] = useTransition();
  const { toast } = useToast();
  
  const handleCrnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCrn = e.target.value.toUpperCase();
    setCrnInput(newCrn);
    setCurrentStagePreview(null);
  }

  const handleCrnBlur = () => {
    if (crnInput.trim()) {
      startStageCheck(async () => {
        const stage = await getStageForCrn(crnInput.trim());
        setCurrentStagePreview(stage);
      })
    }
  }

  const validateNewJourneyFields = () => {
    if (!city) {
      toast({ variant: "destructive", title: "City Required", description: "Please select a city for the new journey." });
      return false;
    }
    if (!customerName.trim()) {
        toast({ variant: "destructive", title: "Customer Name Required", description: "Please enter the customer's name." });
        return false;
    }
    if (!customerEmail.trim() || !customerEmail.endsWith('@gmail.com')) {
        toast({ variant: "destructive", title: "Valid Gmail Required", description: "Please enter a valid Gmail address (e.g., user@gmail.com)." });
        return false;
    }
    if (!/^\d{10}$/.test(customerPhone)) {
        toast({ variant: "destructive", title: "Valid Phone Number Required", description: "Please enter a 10-digit phone number." });
        return false;
    }
    if (!gmv || isNaN(parseFloat(gmv)) || parseFloat(gmv) <= 0) {
      toast({ variant: 'destructive', title: 'Invalid GMV', description: 'Please enter a valid positive number for GMV.' });
      return false;
    }
    return true;
  }

  const handleCrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (crnInput.trim()) {
      // For new journeys, ensure all fields are filled.
      if (!currentStagePreview && !isCheckingStage && !validateNewJourneyFields()) {
          return;
      }

      setLoading(true);
      try {
        const loadedJourney = await getJourney(crnInput.trim(), {
            city: city,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            gmv: parseFloat(gmv)
        });
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
        // Move to next subtask within the same task
        nextStage = { task: currentTask, subTask: subTaskArray[currentSubTaskIndex + 1], city: journey.city };
    } else {
        // Move to the first subtask of the next task
        const currentTaskIndex = tasks.indexOf(currentTask);
        if (currentTaskIndex < tasks.length - 1) {
            const nextTask = tasks[currentTaskIndex + 1];
            nextStage = { task: nextTask, subTask: stageMap[nextTask][0], city: journey.city };
        } else {
            // End of journey, stay on the last stage
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
      await updateJourney(updatedJourney);

      if (stageData.stage.subTask === 'TDDM Initial Meeting') {
          const tddmData = stageData as TDDMInitialMeetingData;
          try {
            await sendTDDMWebhook({
                ...tddmData,
                customerName: journey.customerName,
                customerEmail: journey.customerEmail,
                customerPhone: journey.customerPhone
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
    setCity('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setGmv('');
    setCurrentStagePreview(null);
  };
  
  const availableSubTasks = journey?.currentStage?.task ? stageMap[journey.currentStage.task] : [];
  const isNewJourney = !currentStagePreview && crnInput && !isCheckingStage;


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
                    {isCheckingStage && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</div>}
                    
                    {currentStagePreview && !isCheckingStage && (
                        <div className="text-sm font-medium p-3 bg-secondary rounded-md">
                            <span className="text-muted-foreground">Current Stage:</span> {currentStagePreview.task} - {currentStagePreview.subTask}
                        </div>
                    )}
                    
                    {isNewJourney && (
                        <>
                            <div className="text-sm font-medium p-3 bg-secondary rounded-md">
                                <span className="text-muted-foreground">This looks like a new journey. The first stage will be</span> Recce - Recce Form Submission.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Select onValueChange={setCity} value={city}>
                                        <SelectTrigger id="city">
                                            <SelectValue placeholder="Select city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {areCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerName">Customer Name</Label>
                                    <Input id="customerName" placeholder="e.g. John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="customerEmail">Customer Email</Label>
                                    <Input id="customerEmail" type="email" placeholder="e.g. john@gmail.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerPhone">Customer Phone</Label>
                                    <Input id="customerPhone" type="tel" placeholder="10-digit number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="gmv">GMV</Label>
                                    <Input id="gmv" type="number" placeholder="Enter GMV" value={gmv} onChange={(e) => setGmv(e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}

                    <Button type="submit" className="w-full" disabled={loading || isCheckingStage}>
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
