
import { supabase } from '@/lib/supabase';
import type { CustomerJourney, StageEvent, Task, SubTask, NewJourneyDetails, RecceFormSubmissionData, PostRecceFollowUpData, TDDMInitialMeetingData, TDDMFollowUpData, NegotiationData, SiteVisitData, AgreementDiscussionData, AdvanceMeetingFollowUpData, ClosureMeetingData, PostClosureFollowUpData } from '@/types';
import { stageMap, tasks } from '@/types';


// Helper function to insert data into the correct stage table
async function insertStageEvent(event: StageEvent) {
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
            dataToInsert = { ...baseData, ...nextStepData, negotiation_number: d.negotiationNumber, key_concern: d.keyConcern, solution_recommends: d.solutionRecommends, files: d.files, expected_gmv: d.expected_gmv };
        } else if (subTask === 'Site Visit') {
            const d = event as SiteVisitData;
            dataToInsert = { ...baseData, ...nextStepData, site_visit_date: d.siteVisitDate, attendees: d.attendees, files: d.files, expected_gmv: d.expected_gmv };
        } else if (subTask === 'Agreement Discussion') {
            const d = event as AgreementDiscussionData;
            dataToInsert = { ...baseData, ...nextStepData, agreement_shared: d.agreementShared === 'Yes', expected_signing_date: d.expectedSigningDate, concerns_raised: d.concernsRaised, files: d.files, expected_gmv: d.expected_gmv };
        } else if (subTask === 'Closure Follow Up') {
            const d = event as AdvanceMeetingFollowUpData;
            dataToInsert = { ...baseData, ...nextStepData, follow_up_number: d.followUpNumber, expected_action: d.expectedAction, files: d.files, expected_gmv: d.expected_gmv };
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
  // Step 1: Upsert into raw_data
  const { error: rawDataError } = await supabase.from('raw_data').upsert(
    {
      crn: journey.crn,
      city: journey.city,
      customer_name: journey.customerName,
      customer_email: journey.customerEmail,
      customer_phone: journey.customerPhone,
      gmv: journey.gmv,
      timestamp: new Date().toISOString(),
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

  // Step 3: Upsert into journey_data
  const { error: journeyDataError } = await supabase.from('journey_data').upsert(
    {
      crn: journey.crn,
      current_task: journey.currentStage.task,
      current_subtask: journey.currentStage.subTask,
      is_closed: journey.isClosed,
      timestamp: new Date().toISOString(),
      quoted_gmv: journey.gmv,
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

export async function getAllJourneys(): Promise<CustomerJourney[]> {
    const { data: journeysData, error: journeysError } = await supabase
        .from('journey_data')
        .select(`
            crn,
            current_task,
            current_subtask,
            is_closed,
            quoted_gmv,
            final_gmv,
            raw_data:raw_data!crn(city, customer_name, customer_email, customer_phone, gmv)
        `);

    if (journeysError) {
        console.error('Error fetching journeys:', journeysError);
        throw new Error('Could not fetch journeys from Supabase.');
    }

    // Fetch all history events from all tables. This is inefficient but straightforward.
    // A better approach would be a database function or more complex queries.
    const [recceHistory, tddmHistory, advanceMeetingHistory, closureHistory] = await Promise.all([
        supabase.from('recce_data').select('*'),
        supabase.from('tddm_data').select('*'),
        supabase.from('advance_meeting').select('*'),
        supabase.from('closure_data').select('*')
    ]);

    const allHistoryEvents = [
        ...(recceHistory.data || []).map(e => ({ ...e, task: 'Recce' })),
        ...(tddmHistory.data || []).map(e => ({ ...e, task: 'TDDM' })),
        ...(advanceMeetingHistory.data || []).map(e => ({ ...e, task: 'Advance Meeting' })),
        ...(closureHistory.data || []).map(e => ({ ...e, task: 'Closure' }))
    ];

    const historyByCrn = allHistoryEvents.reduce((acc, event) => {
        const crn = event.crn;
        if (!acc[crn]) {
            acc[crn] = [];
        }
        acc[crn].push(event);
        return acc;
    }, {} as Record<string, any[]>);

    // Sort history for each journey
    for (const crn in historyByCrn) {
        historyByCrn[crn].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    return journeysData.map((journey): CustomerJourney => {
        const rawData = Array.isArray(journey.raw_data) ? journey.raw_data[0] : journey.raw_data;
        const journeyHistory = (historyByCrn[journey.crn] || []).map(event => {
            return {
                id: event.event_id,
                stage: {
                    crn: event.crn,
                    city: event.city,
                    task: event.task as Task,
                    subTask: event.subtask as SubTask,
                },
                user: event.user,
                timestamp: event.timestamp,
                ...event
            } as StageEvent;
        });

        return {
            crn: journey.crn,
            city: rawData?.city,
            customerName: rawData?.customer_name,
            customerEmail: rawData?.customer_email,
            customerPhone: rawData?.customer_phone,
            gmv: rawData?.gmv,
            history: journeyHistory,
            currentStage: {
                task: journey.current_task as Task,
                subTask: journey.current_subtask as SubTask,
                city: rawData?.city,
            },
            isClosed: journey.is_closed,
            quotedGmv: journey.quoted_gmv,
            finalGmv: journey.final_gmv,
        };
    });
}


export async function getStageForCrn(crn: string): Promise<StageRef | null> {
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
    const { data: journeyData, error: journeyError } = await supabase
        .from('journey_data')
        .select(`
            *,
            raw_data:raw_data!inner(city, customer_name, customer_email, customer_phone, gmv)
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
        
        const allHistoryEvents = [
            ...(recceHistory.data || []).map(e => ({ ...e, task: 'Recce' })),
            ...(tddmHistory.data || []).map(e => ({ ...e, task: 'TDDM' })),
            ...(advanceMeetingHistory.data || []).map(e => ({ ...e, task: 'Advance Meeting' })),
            ...(closureHistory.data || []).map(e => ({ ...e, task: 'Closure' }))
        ];

        allHistoryEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const rawData = Array.isArray(journeyData.raw_data) ? journeyData.raw_data[0] : journeyData.raw_data;

        return {
            crn: journeyData.crn,
            city: rawData?.city,
            customerName: rawData?.customer_name,
            customerEmail: rawData?.customer_email,
            customerPhone: rawData?.customer_phone,
            gmv: rawData?.gmv,
            history: allHistoryEvents.map(event => ({
                id: event.event_id,
                stage: { crn, city: event.city, task: event.task as Task, subTask: event.subtask as SubTask },
                user: event.user,
                timestamp: event.timestamp,
                ...event
            }) as StageEvent),
            currentStage: {
                task: journeyData.current_task as Task,
                subTask: journeyData.current_subtask as SubTask,
                city: rawData?.city,
            },
            isClosed: journeyData.is_closed,
            quotedGmv: journeyData.quoted_gmv,
            finalGmv: journeyData.final_gmv,
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
        };
    }


    // If not found anywhere, it's a completely new journey.
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
    };

    // Immediately save this new journey to Supabase
    await updateJourney(newJourney);

    return newJourney;
}
