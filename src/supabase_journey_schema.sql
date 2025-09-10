-- This script contains the complete database schema for the customer journey tracking application.
-- Run these queries in your Supabase SQL Editor to create all necessary tables.

-- Table 1: raw_data
-- Stores the initial, raw information about a customer lead. This is the source of truth for basic customer details.
CREATE TABLE IF NOT EXISTS public.raw_data (
    crn TEXT PRIMARY KEY,
    city TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    gmv NUMERIC,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.raw_data IS 'Stores initial lead information for each customer reference number (CRN).';


-- Table 2: journey_data
-- Tracks the current state and high-level progress of each customer journey.
CREATE TABLE IF NOT EXISTS public.journey_data (
    crn TEXT PRIMARY KEY REFERENCES public.raw_data(crn) ON DELETE CASCADE,
    current_task TEXT,
    current_subtask TEXT,
    is_closed BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    quoted_gmv NUMERIC,
    final_gmv NUMERIC
);
COMMENT ON TABLE public.journey_data IS 'Tracks the real-time status and summary of each customer journey.';


-- Table 3: recce_data
-- Stores all events and data points related to the 'Recce' stage.
CREATE TABLE IF NOT EXISTS public.recce_data (
    event_id TEXT PRIMARY KEY,
    crn TEXT REFERENCES public.raw_data(crn) ON DELETE CASCADE,
    subtask TEXT,
    "user" TEXT,
    timestamp TIMESTAMPTZ,
    city TEXT,
    next_step_brief TEXT,
    next_step_eta TIMESTAMPTZ,
    date_of_recce DATE,
    attendee TEXT,
    recce_template_url TEXT,
    project_start_timeline TEXT,
    has_drawing BOOLEAN,
    drawing_file TEXT,
    architectural_preference TEXT,
    site_condition_notes TEXT,
    expected_closure_date DATE,
    expected_gmv NUMERIC,
    follow_up_number INTEGER,
    expected_action TEXT,
    mom TEXT,
    files TEXT
);
COMMENT ON TABLE public.recce_data IS 'Logs all events and data collected during the Recce stage.';


-- Table 4: tddm_data
-- Stores all events and data points related to the 'TDDM' (Technical Due Diligence Meeting) stage.
CREATE TABLE IF NOT EXISTS public.tddm_data (
    event_id TEXT PRIMARY KEY,
    crn TEXT REFERENCES public.raw_data(crn) ON DELETE CASCADE,
    subtask TEXT,
    "user" TEXT,
    timestamp TIMESTAMPTZ,
    city TEXT,
    next_step_brief TEXT,
    next_step_eta TIMESTAMPTZ,
    tddm_date DATE,
    meeting_location TEXT,
    attendance TEXT,
    attendee_bnb TEXT,
    os_email TEXT,
    duration TEXT,
    expected_closure_date DATE,
    expected_gmv NUMERIC,
    drawing_shared BOOLEAN,
    drawing_file TEXT,
    boq_shared BOOLEAN,
    bye_laws_discussed BOOLEAN,
    sample_flow_plans BOOLEAN,
    roi_discussed BOOLEAN,
    customer_likes TEXT,
    mom TEXT,
    follow_up_number INTEGER,
    expected_action TEXT,
    files TEXT
);
COMMENT ON TABLE public.tddm_data IS 'Logs all events and data from the Technical Due Diligence Meeting (TDDM) stage.';


-- Table 5: advance_meeting
-- Stores all events and data points related to the 'Advance Meeting' stage, which includes negotiations and site visits.
CREATE TABLE IF NOT EXISTS public.advance_meeting (
    event_id TEXT PRIMARY KEY,
    crn TEXT REFERENCES public.raw_data(crn) ON DELETE CASCADE,
    subtask TEXT,
    "user" TEXT,
    timestamp TIMESTAMPTZ,
    city TEXT,
    next_step_brief TEXT,
    next_step_eta TIMESTAMPTZ,
    negotiation_number INTEGER,
    key_concern TEXT,
    solution_recommends TEXT,
    site_visit_date DATE,
    attendees TEXT,
    agreement_shared BOOLEAN,
    expected_signing_date DATE,
    concerns_raised TEXT,
    follow_up_number INTEGER,
    expected_action TEXT,
    expected_gmv NUMERIC,
    files TEXT
);
COMMENT ON TABLE public.advance_meeting IS 'Logs all events from the Advance Meeting stage, including negotiations and site visits.';


-- Table 6: closure_data
-- Stores all events and data points related to the final 'Closure' stage.
CREATE TABLE IF NOT EXISTS public.closure_data (
    event_id TEXT PRIMARY KEY,
    crn TEXT REFERENCES public.raw_data(crn) ON DELETE CASCADE,
    subtask TEXT,
    "user" TEXT,
    timestamp TIMESTAMPTZ,
    city TEXT,
    confirmation_method TEXT[],
    final_gmv NUMERIC,
    agenda TEXT,
    files TEXT
);
COMMENT ON TABLE public.closure_data IS 'Logs all events from the final Closure stage of the journey.';

-- Note: Row Level Security (RLS) policies are not included in this script.
-- You should define RLS policies based on your application's access control requirements.
-- For example, you might want to allow users to see only data related to their city or role.
