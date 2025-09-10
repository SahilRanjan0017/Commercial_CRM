
import { createClient as createServerClient } from '@/utils/supabase/server';
import type { CustomerJourney, StageEvent, Task, SubTask, NewJourneyDetails, RecceFormSubmissionData, PostRecceFollowUpData, TDDMInitialMeetingData, TDDMFollowUpData, NegotiationData, SiteVisitData, AgreementDiscussionData, AdvanceMeetingFollowUpData, ClosureMeetingData, PostClosureFollowUpData } from '@/types';
import { stageMap, tasks } from '@/types';


// Helper function to insert data into the correct stage table
async function insertStageEvent(event: StageEvent) {
  const supabase = createServerClient();
  const { task, subTask } = event.stage;
  let dataToInsert: any;
  let tableName: string;

  const baseData = {
    crn: event.stage.crn,
    event_id: event.id,
    subtask: subTask,
    user: event.user,
    timestamp: event.timestamp,
    city: event.stage.city,
  };
  
  const nextStepData = {
    next_step_brief: 'nextStepBrief' in event ? event.nextStepBrief : null,
    next_step_eta: 'nextStepEta' in event ? event.nextStepEta : null,
  };

  switch (task) {
    case 'Recce':
        tableName = 'recce_data';
        if (subTask === 'Recce Form Submission') {
            const d = event as RecceFormSubmissionData;
            dataToInsert = {
                ...baseData,
                ...nextStepData,
                date_of_recce: d.dateOfRecce,
                attendee: d.attendee,
                recce_template_url: d.recceTemplateUrl,
                project_start_timeline: d.projectStartTimeline,
                has_drawing: d.hasDrawing === 'Yes',
                drawing_file: d.drawingFile,
                architectural_preference: d.architecturalPreference,
                site_condition_notes: d.siteConditionNotes,
                expected_closure_date: d.expectedClosureDate,
                expected_gmv: d.expectedGmv,
            };
        } else if (subTask === 'Post Recce Follow Up') {
            const d = event as PostRecceFollowUpData;
            dataToInsert = {
                ...baseData,
                ...nextStepData,
                follow_up_number: d.followUpNumber,
                expected_action: d.expectedAction,
                mom: d.mom,
                files: d.files,
            };
        }
        break;
    case 'TDDM':
      tableName = 'tddm_data';
      if (subTask === 'TDDM Initial Meeting') {
          const d = event as TDDMInitialMeetingData;
          dataToInsert = {
              ...baseData,
              ...nextStepData,
              tddm_date: d.tddmDate,
              meeting_location: d.meetingLocation,
              attendance: d.attendance,
              attendee_bnb: d.attendeeBnb,
              os_email: d.osEmail,
              duration: d.duration,
              expected_closure_date: d.expectedClosureDate,
              drawing_shared: d.drawingShared === 'Yes',
              drawing_file: d.drawingFile,
              boq_shared: d.boqShared === 'Yes',
              bye_laws_discussed: d.byeLawsDiscussed === 'Yes',
              sample_flow_plans: d.sampleFlowPlansDiscussed === 'Yes',
              roi_discussed: d.roiDiscussed === 'Yes',
              customer_likes: d.customerLikes,
              mom: d.mom,
              expected_gmv: d.expectedGmv,
          };
      } else if (subTask === 'Post TDDM Follow Up') {
          const d = event as TDDMFollowUpData;
          dataToInsert = {
              ...baseData,
              ...nextStepData,
              follow_up_number: d.followUpNumber,
              expected_action: d.expectedAction,
              mom: d.mom,
              files: d.files,
          };
      }
      break;
    case 'Advance Meeting':
      tableName = 'advance_meeting';
       if (subTask === 'Negotiation') {
            const d = event as NegotiationData;
            dataToInsert = { ...baseData, ...nextStepData, negotiation_number: d.negotiationNumber, key_concern: d.keyConcern, solution_recommends: d.solutionRecommends, files: d.files, expected_gmv: d.expectedGmv };
        } else if (subTask === 'Site Visit') {
            const d = event as SiteVisitData;
            dataToInsert = { ...baseData, ...nextStepData, site_visit_date: d.siteVisitDate, attendees: d.attendees, files: d.files, expected_gmv: d.expectedGmv };
        } else if (subTask === 'Agreement Discussion') {
            const d = event as AgreementDiscussionData;
            dataToInsert = { ...baseData, ...nextStepData, agreement_shared: d.agreementShared === 'Yes', expected_signing_date: d.expectedSigningDate, concerns_raised: d.concernsRaised, files: d.files, expected_gmv: d.expectedGmv };
        } else if (subTask === 'Closure Follow Up') {
            const d = event as AdvanceMeetingFollowUpData;
            dataToInsert = { ...baseData, ...nextStepData, follow_up_number: d.followUpNumber, expected_action: d.expectedAction, files: d.files, expected_gmv: d.expectedGmv };
        }
      break;
    case 'Closure':
      tableName = 'closure_data';
      if (subTask === 'Closure Meeting (BA Collection)') {
          const d = event as ClosureMeetingData;
          dataToInsert = { 
              ...baseData, 
              confirmation_method: d.confirmationMethod,
              final_gmv: d.finalGmv,
              files: d.files,
            };
      } else if (subTask === 'Post-Closure Follow Up') {
          const d = event as PostClosureFollowUpData;
          dataToInsert = { 
              ...baseData, 
              agenda: d.agenda, 
              files: d.files,
            };
      }
      break;
    default:
      console.warn(`No Supabase table mapping for task: ${task}`);
      return;
  }
  
  if (!dataToInsert) {
      console.warn(`No data prepared for insert for task: ${task} and subtask: ${subTask}`);
      return;
  }
  
  const { error } = await supabase.from(tableName).insert(dataToInsert);

  if (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw new Error(`Supabase insert failed for ${tableName}.`);
  }
}

export async function updateJourney(journey: CustomerJourney): Promise<void> {
  const supabase = createServerClient();
  // Step 1: Upsert into raw_data
  const { error: rawDataError } = await supabase.from('raw_data').upsert(
    {
      crn: journey.crn,
      city: journey.city,
      customer_name: journey.customerName,
      customer_email: journey.customerEmail,
      customer_phone: journey.customerPhone,
      gmv: journey.gmv,
      timestamp: journey.createdAt || new Date().toISOString(),
    },
    { onConflict: 'crn' }
  );
  if (rawDataError) {
    console.error('Error upserting raw_data:', rawDataError);
    throw new Error('Supabase upsert failed for raw_data.');
  }

  // Step 2: Determine final GMV if journey is closing
  let finalGmv = null;
    if (journey.isClosed) {
        const closureEvent = journey.history.find(
            (event): event is ClosureMeetingData =>
                event.stage.subTask === 'Closure Meeting (BA Collection)'
        );
        if (closureEvent) {
            finalGmv = closureEvent.finalGmv;
        }
    }
    
  let quotedGmv = journey.quotedGmv;
    const recceEvent = journey.history.find(
        (event): event is RecceFormSubmissionData =>
            event.stage.subTask === 'Recce Form Submission'
    );
    if (recceEvent && recceEvent.expectedGmv) {
        quotedGmv = recceEvent.expectedGmv;
    }


  // Step 3: Upsert into journey_data
  const { error: journeyDataError } = await supabase.from('journey_data').upsert(
    {
      crn: journey.crn,
      current_task: journey.currentStage.task,
      current_subtask: journey.currentStage.subTask,
      is_closed: journey.isClosed,
      timestamp: new Date().toISOString(),
      quoted_gmv: quotedGmv,
      final_gmv: finalGmv,
    },
    { onConflict: 'crn' }
  );

  if (journeyDataError) {
    console.error('Error upserting journey_data:', journeyDataError);
    throw new Error('Supabase upsert failed for journey_data.');
  }

  // Step 4: Insert the latest event into the corresponding stage table
  const latestEvent = journey.history[journey.history.length - 1];
  if (latestEvent) {
    await insertStageEvent(latestEvent);
  }
}

function rehydrateEvent(event: any, task: Task): StageEvent {
    const baseEvent: Omit<BaseStageData, 'stage'> = {
        id: event.event_id,
        user: event.user,
        timestamp: event.timestamp,
        nextStepBrief: event.next_step_brief,
        nextStepEta: event.next_step_eta,
        files: event.files,
    };

    const stage: StageRef = {
        crn: event.crn,
        city: event.city,
        task: task,
        subTask: event.subtask as SubTask,
    };
    
    let specificData: any = {};
    
    switch (task) {
        case 'Recce':
            if (stage.subTask === 'Recce Form Submission') {
                specificData = {
                    dateOfRecce: event.date_of_recce,
                    attendee: event.attendee,
                    recceTemplateUrl: event.recce_template_url,
                    projectStartTimeline: event.project_start_timeline,
                    expectedGmv: event.expected_gmv,
                    hasDrawing: event.has_drawing ? 'Yes' : 'No',
                    drawingFile: event.drawing_file,
                    architecturalPreference: event.architectural_preference,
                    siteConditionNotes: event.site_condition_notes,
                    expectedClosureDate: event.expected_closure_date,
                };
            } else if (stage.subTask === 'Post Recce Follow Up') {
                specificData = {
                    followUpNumber: event.follow_up_number,
                    expectedAction: event.expected_action,
                    mom: event.mom,
                };
            }
            break;
        case 'TDDM':
             if (stage.subTask === 'TDDM Initial Meeting') {
                specificData = {
                    tddmDate: event.tddm_date,
                    meetingLocation: event.meeting_location,
                    attendance: event.attendance,
                    attendeeBnb: event.attendee_bnb,
                    osEmail: event.os_email,
                    duration: event.duration,
                    expectedClosureDate: event.expected_closure_date,
                    expectedGmv: event.expected_gmv,
                    drawingShared: event.drawing_shared ? 'Yes' : 'No',
                    drawingFile: event.drawing_file,
                    boqShared: event.boq_shared ? 'Yes' : 'No',
                    byeLawsDiscussed: event.bye_laws_discussed ? 'Yes' : 'No',
                    sampleFlowPlansDiscussed: event.sample_flow_plans ? 'Yes' : 'No',
                    roiDiscussed: event.roi_discussed ? 'Yes' : 'No',
                    customerLikes: event.customer_likes,
                    mom: event.mom,
                };
            } else if (stage.subTask === 'Post TDDM Follow Up') {
                specificData = {
                    followUpNumber: event.follow_up_number,
                    expectedAction: event.expected_action,
                    mom: event.mom,
                };
            }
            break;
        case 'Advance Meeting':
            if (stage.subTask === 'Negotiation') {
                specificData = { negotiationNumber: event.negotiation_number, expectedGmv: event.expected_gmv, keyConcern: event.key_concern, solutionRecommends: event.solution_recommends };
            } else if (stage.subTask === 'Site Visit') {
                specificData = { siteVisitDate: event.site_visit_date, attendees: event.attendees, expectedGmv: event.expected_gmv };
            } else if (stage.subTask === 'Agreement Discussion') {
                specificData = { agreementShared: event.agreement_shared ? 'Yes' : 'No', expectedSigningDate: event.expected_signing_date, concernsRaised: event.concerns_raised, expectedGmv: event.expected_gmv };
            } else if (stage.subTask === 'Closure Follow Up') {
                specificData = { followUpNumber: event.follow_up_number, expectedAction: event.expected_action, expectedGmv: event.expected_gmv };
            }
            break;
        case 'Closure':
            if (stage.subTask === 'Closure Meeting (BA Collection)') {
                specificData = { confirmationMethod: event.confirmation_method, finalGmv: event.final_gmv };
            } else if (stage.subTask === 'Post-Closure Follow Up') {
                specificData = { agenda: event.agenda };
            }
            break;
    }

    return { ...baseEvent, stage, ...specificData } as StageEvent;
}

export async function getAllJourneys(): Promise<CustomerJourney[]> {
    const supabase = createServerClient();
    const [recceHistory, tddmHistory, advanceMeetingHistory, closureHistory, rawDataResponse, journeyDataResponse] = await Promise.all([
        supabase.from('recce_data').select('*'),
        supabase.from('tddm_data').select('*'),
        supabase.from('advance_meeting').select('*'),
        supabase.from('closure_data').select('*'),
        supabase.from('raw_data').select('*'),
        supabase.from('journey_data').select('*')
    ]);

    const errors = [recceHistory.error, tddmHistory.error, advanceMeetingHistory.error, closureHistory.error, rawDataResponse.error, journeyDataResponse.error].filter(Boolean);
    if (errors.length > 0) {
        console.error("Error fetching data:", errors);
        throw new Error("Could not fetch journey data from Supabase.");
    }
    
    const rawDataMap = new Map((rawDataResponse.data || []).map(r => [r.crn, r]));
    const journeyDataMap = new Map((journeyDataResponse.data || []).map(j => [j.crn, j]));
    
    const historyByCrn: Record<string, StageEvent[]> = {};
    
    (recceHistory.data || []).forEach(e => {
        if (!historyByCrn[e.crn]) historyByCrn[e.crn] = [];
        historyByCrn[e.crn].push(rehydrateEvent(e, 'Recce'));
    });
    (tddmHistory.data || []).forEach(e => {
        if (!historyByCrn[e.crn]) historyByCrn[e.crn] = [];
        historyByCrn[e.crn].push(rehydrateEvent(e, 'TDDM'));
    });
    (advanceMeetingHistory.data || []).forEach(e => {
        if (!historyByCrn[e.crn]) historyByCrn[e.crn] = [];
        historyByCrn[e.crn].push(rehydrateEvent(e, 'Advance Meeting'));
    });
    (closureHistory.data || []).forEach(e => {
        if (!historyByCrn[e.crn]) historyByCrn[e.crn] = [];
        historyByCrn[e.crn].push(rehydrateEvent(e, 'Closure'));
    });

    for (const crn in historyByCrn) {
        historyByCrn[crn].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    const allCrns = Array.from(rawDataMap.keys());

    return allCrns.map((crn): CustomerJourney | null => {
        const rawInfo = rawDataMap.get(crn);
        if (!rawInfo) return null;

        const journeyInfo = journeyDataMap.get(crn);
        const journeyHistory = historyByCrn[crn] || [];
        const lastEvent = journeyHistory.length > 0 ? journeyHistory[journeyHistory.length - 1] : null;

        let currentStage: Omit<StageRef, 'crn'>;
        let isClosed = false;

        if (journeyInfo) {
            currentStage = {
                task: journeyInfo.current_task as Task,
                subTask: journeyInfo.current_subtask as SubTask,
                city: rawInfo.city,
            };
            isClosed = journeyInfo.is_closed;
        } else if (lastEvent) {
             const { task, subTask } = lastEvent.stage;
             const subTaskArray = stageMap[task];
             const currentSubTaskIndex = subTaskArray.indexOf(subTask);
             
             if (currentSubTaskIndex < subTaskArray.length - 1) {
                 currentStage = { task, subTask: subTaskArray[currentSubTaskIndex + 1], city: rawInfo.city };
             } else {
                 const currentTaskIndex = tasks.indexOf(task);
                 if (currentTaskIndex < tasks.length - 1) {
                     const nextTask = tasks[currentTaskIndex + 1];
                     currentStage = { task: nextTask, subTask: stageMap[nextTask][0], city: rawInfo.city };
                 } else {
                     currentStage = lastEvent.stage;
                     isClosed = true;
                 }
             }
        } else {
            currentStage = { task: 'Recce', subTask: 'Recce Form Submission', city: rawInfo.city };
        }

        return {
            crn: crn,
            city: rawInfo.city,
            customerName: rawInfo.customer_name,
            customerEmail: rawInfo.customer_email,
            customerPhone: rawInfo.customer_phone,
            gmv: rawInfo.gmv,
            history: journeyHistory,
            currentStage: currentStage,
            isClosed: isClosed,
            quotedGmv: journeyInfo?.quoted_gmv ?? rawInfo.gmv,
            finalGmv: journeyInfo?.final_gmv,
            createdAt: rawInfo.timestamp,
        };
    }).filter((j): j is CustomerJourney => j !== null);
}


export async function getStageForCrn(crn: string): Promise<StageRef | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('journey_data')
    .select('current_task, current_subtask, raw_data(city)')
    .eq('crn', crn)
    .single();

  if (error || !data) {
    // If not in journey_data, check raw_data for migrated users
     const { data: rawData, error: rawError } = await supabase
      .from('raw_data')
      .select('city')
      .eq('crn', crn)
      .single();
    
    if (rawData) {
      // This is a migrated journey, start it at the TDDM meeting stage
      const initialTask: Task = 'TDDM';
      const initialSubTask = stageMap[initialTask][0];
      return { crn, city: rawData.city, task: initialTask, subTask: initialSubTask };
    }
    return null;
  }
  
  const rawData = Array.isArray(data.raw_data) ? data.raw_data[0] : data.raw_data;

  return {
    crn,
    city: rawData?.city,
    task: data.current_task as Task,
    subTask: data.current_subtask as SubTask,
  };
}


export async function getJourney(crn: string, newJourneyDetails: NewJourneyDetails): Promise<CustomerJourney> {
    const supabase = createServerClient();
    const { data: journeyData, error: journeyError } = await supabase
        .from('journey_data')
        .select(`
            *,
            raw_data:raw_data!inner(city, customer_name, customer_email, customer_phone, gmv, timestamp)
        `)
        .eq('crn', crn)
        .single();
    
    if (journeyData) {
        // Journey exists, fetch its history and return
        const [recceHistory, tddmHistory, advanceMeetingHistory, closureHistory] = await Promise.all([
            supabase.from('recce_data').select('*').eq('crn', crn),
            supabase.from('tddm_data').select('*').eq('crn', crn),
            supabase.from('advance_meeting').select('*').eq('crn', crn),
            supabase.from('closure_data').select('*').eq('crn', crn)
        ]);
        
        const historyByCrn: Record<string, StageEvent[]> = {};
        
        (recceHistory.data || []).forEach(e => {
            if (!historyByCrn[e.crn]) historyByCrn[e.crn] = [];
            historyByCrn[e.crn].push(rehydrateEvent(e, 'Recce'));
        });
        (tddmHistory.data || []).forEach(e => {
            if (!historyByCrn[e.crn]) historyByCrn[e.crn] = [];
            historyByCrn[e.crn].push(rehydrateEvent(e, 'TDDM'));
        });
        (advanceMeetingHistory.data || []).forEach(e => {
            if (!historyByCrn[e.crn]) historyByCrn[e.crn] = [];
            historyByCrn[e.crn].push(rehydrateEvent(e, 'Advance Meeting'));
        });
        (closureHistory.data || []).forEach(e => {
            if (!historyByCrn[e.crn]) historyByCrn[e.crn] = [];
            historyByCrn[e.crn].push(rehydrateEvent(e, 'Closure'));
        });

        const history = historyByCrn[crn] || [];
        history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const rawData = Array.isArray(journeyData.raw_data) ? journeyData.raw_data[0] : journeyData.raw_data;

        return {
            crn: journeyData.crn,
            city: rawData?.city,
            customerName: rawData?.customer_name,
            customerEmail: rawData?.customer_email,
            customerPhone: rawData?.customer_phone,
            gmv: rawData?.gmv,
            history: history,
            currentStage: {
                task: journeyData.current_task as Task,
                subTask: journeyData.current_subtask as SubTask,
                city: rawData?.city,
            },
            isClosed: journeyData.is_closed,
            quotedGmv: journeyData.quoted_gmv,
            finalGmv: journeyData.final_gmv,
            createdAt: rawData?.timestamp,
        };
    }

    // If journey doesn't exist in journey_data, check raw_data
    const { data: rawData, error: rawError } = await supabase
        .from('raw_data')
        .select('*')
        .eq('crn', crn)
        .single();

    if (rawData) {
        // This is a migrated journey, start it at the TDDM meeting stage
        const initialTask: Task = 'TDDM';
        const initialSubTask = stageMap[initialTask][0];
        return {
            crn,
            city: rawData.city,
            customerName: rawData.customer_name,
            customerEmail: rawData.customer_email,
            customerPhone: rawData.customer_phone,
            gmv: rawData.gmv,
            currentStage: { task: initialTask, subTask: initialSubTask, city: rawData.city },
            isClosed: false,
            history: [],
            createdAt: rawData.timestamp
        };
    }


    // If not found anywhere, it's a completely new journey.
    const newJourneyTimestamp = new Date().toISOString();
    const newStage = { task: tasks[0], subTask: stageMap[tasks[0]][0], city: newJourneyDetails.city };
    const newJourney: CustomerJourney = {
        crn,
        city: newJourneyDetails.city,
        customerName: newJourneyDetails.customerName,
        customerEmail: newJourneyDetails.customerEmail,
        customerPhone: newJourneyDetails.customerPhone,
        gmv: newJourneyDetails.gmv,
        currentStage: newStage,
        history: [],
        isClosed: false,
        createdAt: newJourneyTimestamp,
    };

    // Immediately save this new journey to Supabase
    await updateJourney(newJourney);

    return newJourney;
}
