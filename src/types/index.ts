

export type Task = 'Recce' | 'TDDM' | 'Advance Meeting' | 'Closure';

export type RecceSubTask = 'Recce Form Submission' | 'Post Recce Follow Up';
export type TDDMSubTask = 'TDDM Initial Meeting' | 'Post TDDM Follow Up';
export type AdvanceMeetingSubTask = 'Negotiation' | 'Site Visit' | 'Agreement Discussion' | 'Closure Follow Up';
export type ClosureSubTask = 'Closure Meeting (BA Collection)' | 'Post-Closure Follow Up';

export type SubTask = RecceSubTask | TDDMSubTask | AdvanceMeetingSubTask | ClosureSubTask;

export const stageMap: Record<Task, SubTask[]> = {
    'Recce': ['Recce Form Submission', 'Post Recce Follow Up'],
    'TDDM': ['TDDM Initial Meeting', 'Post TDDM Follow Up'],
    'Advance Meeting': ['Negotiation', 'Site Visit', 'Agreement Discussion', 'Closure Follow Up'],
    'Closure': ['Closure Meeting (BA Collection)', 'Post-Closure Follow Up'],
};

export const tasks: Task[] = ['Recce', 'TDDM', 'Advance Meeting', 'Closure'];

export const stageDurations = ['<30 min', '30-60 min', '60-90 min', '90-120 min', '>120 min'];
export const projectStartTimelines = ['<3 M', '3-6 M', '6-9 M', '9-12 M', '>12 M'];

export interface StageRef {
    task: Task;
    subTask: SubTask;
    crn: string; 
    city: string;
}

export interface BaseStageData {
  id: string;
  stage: StageRef;
  user: string; // For audit trail
  timestamp: string;
  nextStepBrief?: string;
  nextStepEta?: string;
  files?: string; // URL of the uploaded file
}

export interface RecceFormSubmissionData extends BaseStageData {
  stage: StageRef & { task: 'Recce', subTask: 'Recce Form Submission' };
  dateOfRecce: string;
  attendee: string;
  recceTemplateUrl?: string;
  projectStartTimeline: string;
  expectedGmv: number;
  hasDrawing: 'Yes' | 'No';
  drawingFile?: string; // URL of the uploaded file
  architecturalPreference?: string;
  siteConditionNotes?: string;
  expectedClosureDate: string;
}

export interface PostRecceFollowUpData extends BaseStageData {
    stage: StageRef & { task: 'Recce', subTask: 'Post Recce Follow Up' };
    followUpNumber: number;
    expectedAction: string;
    mom?: string;
}

export interface TDDMInitialMeetingData extends BaseStageData {
  stage: StageRef & { task: 'TDDM', subTask: 'TDDM Initial Meeting' };
  tddmDate: string;
  meetingLocation: string;
  attendance: string; // Who from client side
  attendeeBnb: string; // Who from BNB side
  osEmail?: string;
  duration: string;
  expectedClosureDate: string;
  expectedGmv: number;
  drawingShared: 'Yes' | 'No';
  drawingFile?: string; // URL of the uploaded file
  boqShared: 'Yes' | 'No';
  byeLawsDiscussed: 'Yes' | 'No';
  sampleFlowPlansDiscussed: 'Yes' | 'No';
  roiDiscussed: 'Yes' | 'No';
  customerLikes?: string;
  mom?: string;
}

export interface TDDMFollowUpData extends BaseStageData {
    stage: StageRef & { task: 'TDDM', subTask: 'Post TDDM Follow Up' };
    followUpNumber: number;
    expectedAction: string; // "Customer Expected Action / Agenda"
    mom?: string;
}

export interface NegotiationData extends BaseStageData {
  stage: StageRef & { task: 'Advance Meeting', subTask: 'Negotiation' };
  negotiationNumber: number;
  expectedGmv: number;
  keyConcern?: string;
  solutionRecommends?: string;
}

export interface SiteVisitData extends BaseStageData {
  stage: StageRef & { task: 'Advance Meeting', subTask: 'Site Visit' };
  siteVisitDate: string;
  attendees: string;
  expectedGmv: number;
}

export interface AgreementDiscussionData extends BaseStageData {
  stage: StageRef & { task: 'Advance Meeting', subTask: 'Agreement Discussion' };
  agreementShared: 'Yes' | 'No';
  expectedSigningDate: string;
  concernsRaised?: string;
  expectedGmv: number;
}

export interface AdvanceMeetingFollowUpData extends BaseStageData {
  stage: StageRef & { task: 'Advance Meeting', subTask: 'Closure Follow Up' };
  followUpNumber: number;
  expectedAction: string;
  expectedGmv: number;
}

export interface ClosureMeetingData extends BaseStageData {
    stage: StageRef & { task: 'Closure', subTask: 'Closure Meeting (BA Collection)' };
    confirmationMethod: string[];
    finalGmv: number;
    nextStepBrief?: undefined;
    nextStepEta?: undefined;
}

export interface PostClosureFollowUpData extends BaseStageData {
    stage: StageRef & { task: 'Closure', subTask: 'Post-Closure Follow Up' };
    agenda?: string;
    nextStepBrief?: undefined;
    nextStepEta?: undefined;
}


export type StageEvent =
  | RecceFormSubmissionData
  | PostRecceFollowUpData
  | TDDMInitialMeetingData
  | TDDMFollowUpData
  | NegotiationData
  | SiteVisitData
  | AgreementDiscussionData
  | AdvanceMeetingFollowUpData
  | ClosureMeetingData
  | PostClosureFollowUpData;

export interface CustomerJourney {
  crn: string;
  city: string;
  gmv?: number; // This is the initial/quoted GMV
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  history: StageEvent[];
  currentStage: Omit<StageRef, 'crn'>;
  isClosed: boolean;
  quotedGmv?: number;
  finalGmv?: number;
  createdAt?: string;
}

export interface NewJourneyDetails {
    city: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    gmv: number;
}

    

    