
'use client';

import { useState } from 'react';
import type { CustomerJourney, StageRef, BaseStageData } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { projectStartTimelines, stageDurations, stageMap, tasks } from '@/types';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from './file-uploader';

const baseSchema = z.object({
  nextStepBrief: z.string().optional(),
  nextStepEta: z.date().optional().nullable(),
});

const recceFormSubmissionSchema = baseSchema.extend({
    dateOfRecce: z.date({ required_error: 'Date of Recce is required.' }),
    attendee: z.string().min(1, 'Required'),
    recceTemplateUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    projectStartTimeline: z.string().min(1, 'Required'),
    expectedGmv: z.coerce.number().positive({ message: "Expected GMV must be a positive number." }),
    hasDrawing: z.enum(['Yes', 'No'], { required_error: 'This field is required.'}),
    drawingFile: z.string().optional(),
    architecturalPreference: z.string().optional(),
    siteConditionNotes: z.string().optional(),
    expectedClosureDate: z.date({ required_error: 'Expected closure date is required.' }),
});

const postRecceFollowUpSchema = baseSchema.extend({
    expectedAction: z.string().min(1, 'Required'),
    mom: z.string().optional(),
    files: z.string().optional(),
});

const tddmInitialMeetingSchema = baseSchema.extend({
    tddmDate: z.date({ required_error: 'TDDM Date is required.' }),
    meetingLocation: z.string().min(1, 'Required'),
    attendance: z.string().min(1, 'Required').max(200),
    attendeeBnb: z.string().min(1, 'Required'),
    osEmail: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
    duration: z.string().min(1, 'Required'),
    expectedClosureDate: z.date({ required_error: 'Expected closure date is required.' }),
    expectedGmv: z.coerce.number().positive({ message: "Expected GMV must be a positive number." }),
    drawingShared: z.enum(['Yes', 'No']),
    drawingFile: z.string().optional(),
    boqShared: z.enum(['Yes', 'No']),
    byeLawsDiscussed: z.enum(['Yes', 'No']),
    sampleFlowPlansDiscussed: z.enum(['Yes', 'No']),
    roiDiscussed: z.enum(['Yes', 'No']),
    customerLikes: z.string().optional(),
    mom: z.string().optional(),
});

const postTddmFollowUpSchema = baseSchema.extend({
    expectedAction: z.string().min(1, 'Required'),
    mom: z.string().optional(),
    files: z.string().optional(),
});

const negotiationSchema = baseSchema.extend({
    expectedGmv: z.coerce.number().positive({ message: "Expected GMV must be a positive number." }),
    keyConcern: z.string().optional(),
    solutionRecommends: z.string().optional(),
    files: z.string().optional(),
});

const siteVisitSchema = baseSchema.extend({
    siteVisitDate: z.date({ required_error: 'Site visit date is required.' }),
    attendees: z.string().min(1, 'Attendees are required.'),
    expectedGmv: z.coerce.number().positive({ message: "Expected GMV must be a positive number." }),
    files: z.string().optional(),
});

const agreementDiscussionSchema = baseSchema.extend({
    agreementShared: z.enum(['Yes', 'No']),
    expectedSigningDate: z.date({ required_error: 'Expected signing date is required.' }),
    concernsRaised: z.string().optional(),
    expectedGmv: z.coerce.number().positive({ message: "Expected GMV must be a positive number." }),
    files: z.string().optional(),
});

const closureFollowUpSchema = baseSchema.extend({
    expectedAction: z.string().min(1, 'Required'),
    expectedGmv: z.coerce.number().positive({ message: "Expected GMV must be a positive number." }),
    files: z.string().optional(),
});

const closureMeetingSchema = z.object({
    confirmationMethod: z.array(z.string()).refine((value) => value.some((item) => item), {
        message: "You have to select at least one item.",
    }),
    finalGmv: z.coerce.number().positive({ message: "Final GMV must be a positive number." }),
    files: z.string().optional(),
});

const postClosureFollowUpSchema = z.object({
    agenda: z.string().optional(),
    files: z.string().optional(),
});


// Generic follow up for Advance Meeting
const followUpSchema = baseSchema.extend({
    expectedAction: z.string().min(1, 'Required'),
});


const stageSchemas = {
    'Recce Form Submission': recceFormSubmissionSchema,
    'Post Recce Follow Up': postRecceFollowUpSchema,
    'TDDM Initial Meeting': tddmInitialMeetingSchema,
    'Post TDDM Follow Up': postTddmFollowUpSchema,
    'Negotiation': negotiationSchema,
    'Site Visit': siteVisitSchema,
    'Agreement Discussion': agreementDiscussionSchema,
    'Closure Follow Up': closureFollowUpSchema,
    'Closure Meeting (BA Collection)': closureMeetingSchema,
    'Post-Closure Follow Up': postClosureFollowUpSchema,
}

interface StageFormsProps {
  currentStage: Omit<StageRef, 'crn'>;
  onSubmit: (data: any) => void;
  journey: CustomerJourney;
  isSubmitting?: boolean;
}

const YesNoOptions = ['Yes', 'No'];

const ConfirmationOptions = [
    { id: 'Email Confirmation Received', label: 'Email Confirmation Received' },
    { id: 'BA Collected', label: 'BA Collected' },
    { id: 'MOM/Agreement Signed', label: 'MOM/Agreement Signed' },
]

const TDDMLocations = ['BNB Office', 'Client Location', 'Cafe/Resturant', 'Other'];

function StageFormRender({ currentStage, onSubmit, journey, isSubmitting }: StageFormsProps) {
    const { toast } = useToast();

    const form = useForm({
        resolver: (currentStage?.subTask && stageSchemas[currentStage.subTask]) ? zodResolver(stageSchemas[currentStage.subTask]) : undefined,
        defaultValues: {
            // Common
            nextStepBrief: '',
            nextStepEta: null,
            mom: '',
            files: '',
            // Recce Form Submission
            dateOfRecce: null,
            attendee: '',
            recceTemplateUrl: '',
            projectStartTimeline: '',
            expectedGmv: 0,
            hasDrawing: 'No',
            drawingFile: '',
            architecturalPreference: '',
            siteConditionNotes: '',
            expectedClosureDate: null,
            // Follow-ups (Recce, TDDM, Advance)
            expectedAction: '',
            // TDDM Initial Meeting
            tddmDate: null,
            meetingLocation: '',
            attendance: '',
            attendeeBnb: '',
            osEmail: '',
            duration: '',
            drawingShared: 'No',
            boqShared: 'No',
            byeLawsDiscussed: 'No',
            sampleFlowPlansDiscussed: 'No',
            roiDiscussed: 'No',
            customerLikes: '',
            // Negotiation
            keyConcern: '',
            solutionRecommends: '',
            // Site Visit
            siteVisitDate: null,
            attendees: '',
            // Agreement Discussion
            agreementShared: 'No',
            expectedSigningDate: null,
            concernsRaised: '',
            // Closure Meeting
            confirmationMethod: [],
            finalGmv: 0,
            // Post-Closure Follow Up
            agenda: '',
        },
    });

  const getNextStageName = () => {
    if (!currentStage?.task) return 'Journey End';
    const { task, subTask } = currentStage;
    const subTasks = stageMap[task];
    if (!subTasks) return 'Journey End';
    const currentSubTaskIndex = subTasks.indexOf(subTask);

    if (currentSubTaskIndex !== -1 && currentSubTaskIndex < subTasks.length - 1) {
        return `${task} - ${subTasks[currentSubTaskIndex + 1]}`;
    }
    
    const currentTaskIndex = tasks.indexOf(task);
    if (currentTaskIndex !== -1 && currentTaskIndex < tasks.length - 1) {
        const nextTask = tasks[currentTaskIndex + 1];
        return `${nextTask} - ${stageMap[nextTask][0]}`;
    }
    
    return 'Journey End';
  }

  const handleFormSubmit = async (values: any) => {
    if (!currentStage) return;

    const submittedValues = { ...values };

    const stageWithCrn: StageRef = {
        ...currentStage,
        crn: journey.crn,
        city: journey.city,
    };

    const baseData: Partial<BaseStageData> = {
        id: new Date().toISOString(),
        stage: stageWithCrn,
        user: 'Admin', // Hardcoded user
        timestamp: new Date().toISOString(),
    };
    
    if (values.nextStepBrief) baseData.nextStepBrief = values.nextStepBrief;
    if (values.nextStepEta) baseData.nextStepEta = values.nextStepEta.toISOString();
    
    let stageData: any;
    
    // Convert dates to ISO strings before submitting
    for (const key in submittedValues) {
        if (submittedValues[key] instanceof Date) {
            submittedValues[key] = submittedValues[key].toISOString();
        }
    }
    
    // Add specific properties based on the subtask
    switch(currentStage.subTask) {
        case 'Post Recce Follow Up':
            submittedValues.followUpNumber = journey.history.filter(h => h.stage.subTask === 'Post Recce Follow Up').length + 1;
            break;
        case 'Post TDDM Follow Up':
            submittedValues.followUpNumber = journey.history.filter(h => h.stage.subTask === 'Post TDDM Follow Up').length + 1;
            break;
        case 'Negotiation':
             submittedValues.negotiationNumber = journey.history.filter(h => h.stage.subTask === 'Negotiation').length + 1;
            break;
        case 'Closure Follow Up':
            submittedValues.followUpNumber = journey.history.filter(h => h.stage.subTask === 'Closure Follow Up').length + 1;
            break;
    }

    stageData = { ...baseData, ...submittedValues };
    onSubmit(stageData);
    form.reset();
  };
  
  const nextStageName = getNextStageName();
  const hasDrawing = form.watch('hasDrawing');
  const drawingSharedTDDM = form.watch('drawingShared');
  
  const showNextStepFields = !['Closure Meeting (BA Collection)', 'Post-Closure Follow Up'].includes(currentStage.subTask);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {currentStage.subTask === 'Recce Form Submission' && (
            <>
                <FormField control={form.control} name="dateOfRecce" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date of Recce</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} fromDate={new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="attendee" render={({ field }) => (<FormItem><FormLabel>Attendee Name & Designation</FormLabel><FormControl><Input placeholder="e.g. John Smith (Architect)" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="recceTemplateUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Recce Template URL</FormLabel>
                        <FormControl><Input placeholder="https://docs.google.com/spreadsheets/..." {...field} /></FormControl>
                        <FormDescription>
                            <Link href="https://docs.google.com/spreadsheets/d/1pdta-qCa5steVE_4nAYDHjzJPzONFd0J6EOqVJCiR4w/edit?gid=0#gid=0" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Use this template
                            </Link> by making a copy, then paste your own sheet link here.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="projectStartTimeline" render={({ field }) => (
                    <FormItem><FormLabel>Project Start Timeline</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger></FormControl>
                            <SelectContent>{projectStartTimelines.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="expectedGmv" render={({ field }) => (<FormItem><FormLabel>Expected GMV (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 7500000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="expectedClosureDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Expected Closure Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} fromDate={new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="hasDrawing" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Has a client Share any drawing</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Yes" /></FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="No" /></FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                {hasDrawing === 'Yes' && (
                  <FormField control={form.control} name="drawingFile" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Drawing</FormLabel>
                      <FormControl>
                        <FileUploader
                            crn={journey.crn}
                            task={currentStage.task}
                            onUploadSuccess={(url) => form.setValue('drawingFile', url, { shouldValidate: true })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                )}
                 <FormField control={form.control} name="architecturalPreference" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Any Architectural Preference</FormLabel><FormControl><Textarea placeholder="e.g. Modern, minimalist, industrial..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="siteConditionNotes" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Any Site Condition Notes</FormLabel><FormControl><Textarea placeholder="e.g. Needs waterproofing, existing structure is weak..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </>
        )}

        {currentStage.subTask === 'Post Recce Follow Up' && (
            <>
                <FormField control={form.control} name="expectedAction" render={({ field }) => (<FormItem><FormLabel>Customer Expected Action</FormLabel><FormControl><Input placeholder="e.g. Client to confirm budget" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="mom" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>MOM (Minutes of Meeting)</FormLabel><FormControl><Textarea placeholder="Enter meeting minutes..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="files" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('files', url, { shouldValidate: true })}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </>
        )}
        
        {currentStage.subTask === 'Post TDDM Follow Up' && (
            <>
                <FormField control={form.control} name="expectedAction" render={({ field }) => (<FormItem><FormLabel>Customer Expected Action / Agenda</FormLabel><FormControl><Input placeholder="e.g. Client to confirm budget" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="mom" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>MOM (Minutes of Meeting)</FormLabel><FormControl><Textarea placeholder="Enter meeting minutes..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="files" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('files', url, { shouldValidate: true })}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </>
        )}
        

        {currentStage.subTask === 'TDDM Initial Meeting' && (
            <>
                <FormField control={form.control} name="tddmDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>TDDM Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} fromDate={new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="meetingLocation" render={({ field }) => (
                    <FormItem>
                        <FormLabel>TDDM Meeting Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {TDDMLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="attendance" render={({ field }) => (<FormItem><FormLabel>Who attended from Customer Side?</FormLabel><FormControl><Input placeholder="Client-side attendees" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="attendeeBnb" render={({ field }) => (<FormItem><FormLabel>Who attendee from BNB Side (use , for multiple people)</FormLabel><FormControl><Input placeholder="BNB-side attendees" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="osEmail" render={({ field }) => (<FormItem><FormLabel>OS Email Address</FormLabel><FormControl><Input placeholder="os@example.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem><FormLabel>Duration</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger></FormControl>
                            <SelectContent>{stageDurations.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="expectedClosureDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Expected Date of Closure</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} fromDate={new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="expectedGmv" render={({ field }) => (<FormItem><FormLabel>Expected GMV (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 7500000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="drawingShared" render={({ field }) => (<FormItem><FormLabel>Drawings Share by Clients</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{YesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                {drawingSharedTDDM === 'Yes' && (
                  <FormField control={form.control} name="drawingFile" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Drawing</FormLabel>
                       <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('drawingFile', url, { shouldValidate: true })}
                            />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                )}
                <FormField control={form.control} name="boqShared" render={({ field }) => (<FormItem><FormLabel>Did we discuss the quotation?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{YesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="byeLawsDiscussed" render={({ field }) => (<FormItem><FormLabel>Did we discuss the Bye Laws?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{YesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="sampleFlowPlansDiscussed" render={({ field }) => (<FormItem><FormLabel>Did we discuss the Sample Flow plans?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{YesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="roiDiscussed" render={({ field }) => (<FormItem><FormLabel>Did We discuss the ROI??</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{YesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="customerLikes" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>What did Customer Like</FormLabel><FormControl><Textarea placeholder="What aspects of the proposal or discussion did the customer respond to positively?" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="mom" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>MoM</FormLabel><FormControl><Textarea placeholder="Minutes of Meeting..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </>
        )}
        
        {currentStage.task === 'Advance Meeting' && currentStage.subTask === 'Closure Follow Up' && (
            <>
                <FormField control={form.control} name="expectedAction" render={({ field }) => (<FormItem><FormLabel>Expected Action</FormLabel><FormControl><Input placeholder="e.g. Client to confirm budget" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="expectedGmv" render={({ field }) => (<FormItem><FormLabel>Expected GMV (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 7500000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="files" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('files', url, { shouldValidate: true })}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </>
        )}

        {currentStage.subTask === 'Negotiation' && (
             <>
                <FormField control={form.control} name="expectedGmv" render={({ field }) => (<FormItem><FormLabel>Expected GMV (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 7500000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="keyConcern" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Key Concern of the Client</FormLabel><FormControl><Textarea placeholder="Describe the client's key concerns..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="solutionRecommends" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Solution Recommends</FormLabel><FormControl><Textarea placeholder="Describe the recommended solution..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="files" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('files', url, { shouldValidate: true })}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </>
        )}

        {currentStage.subTask === 'Site Visit' && (
            <>
                <FormField control={form.control} name="siteVisitDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Site Visit Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} fromDate={new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="attendees" render={({ field }) => (<FormItem><FormLabel>Attendees</FormLabel><FormControl><Input placeholder="e.g. John Doe, Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="expectedGmv" render={({ field }) => (<FormItem><FormLabel>Expected GMV (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 7500000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="files" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('files', url, { shouldValidate: true })}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </>
        )}

        {currentStage.subTask === 'Agreement Discussion' && (
            <>
                <FormField control={form.control} name="agreementShared" render={({ field }) => (<FormItem><FormLabel>Agreement Shared?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{YesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="expectedSigningDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Expected Signing Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} fromDate={new Date()} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>
                <FormField control={form.control} name="expectedGmv" render={({ field }) => (<FormItem><FormLabel>Expected GMV (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 7500000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="concernsRaised" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Any Concern Raised</FormLabel><FormControl><Textarea placeholder="Detail any concerns raised by the client..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="files" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('files', url, { shouldValidate: true })}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </>
        )}
        
        {currentStage.subTask === 'Closure Meeting (BA Collection)' && (
            <>
                 <FormField control={form.control} name="finalGmv" render={({ field }) => (<FormItem><FormLabel>Final GMV (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 7000000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField
                    control={form.control}
                    name="confirmationMethod"
                    render={() => (
                        <FormItem className="md:col-span-2">
                        <div className="mb-4">
                            <FormLabel className="text-base">Confirmation Received Via</FormLabel>
                            <FormDescription>
                                Select all applicable confirmation methods.
                            </FormDescription>
                        </div>
                        {ConfirmationOptions.map((item) => (
                            <FormField
                            key={item.id}
                            control={form.control}
                            name="confirmationMethod"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item.id
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                    {item.label}
                                    </FormLabel>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField control={form.control} name="files" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('files', url, { shouldValidate: true })}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </>
        )}
        
        {currentStage.subTask === 'Post-Closure Follow Up' && (
            <>
                 <FormField control={form.control} name="agenda" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Post closure meeting (Agenda of Meeting)</FormLabel><FormControl><Textarea placeholder="Describe the agenda of the post-closure meeting..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="files" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <FileUploader
                                crn={journey.crn}
                                task={currentStage.task}
                                onUploadSuccess={(url) => form.setValue('files', url, { shouldValidate: true })}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </>
        )}


        </div>
        
        {showNextStepFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                 <FormField control={form.control} name="nextStepBrief" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Next Step Brief</FormLabel><FormControl><Textarea placeholder="Add a brief description of the next steps..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="nextStepEta" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Next Step ETA</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} fromDate={new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            </div>
        )}

        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {nextStageName === 'Journey End' ? 'Mark as Closed' : `Save & Move to ${nextStageName}`}
        </Button>
      </form>
    </Form>
  );
}

export function StageForms(props: StageFormsProps) {
    if (!props.currentStage?.subTask) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">Select a stage to see the form.</div>;
    }
    return <StageFormRender key={props.currentStage.task + props.currentStage.subTask} {...props} />
}
