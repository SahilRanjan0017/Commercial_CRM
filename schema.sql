-- This table stores the raw, initial data captured for each customer.
CREATE TABLE IF NOT EXISTS public.raw_data (
    crn TEXT PRIMARY KEY,
    city TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    gmv NUMERIC,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- This table tracks the current state and high-level summary of each journey.
CREATE TABLE IF NOT EXISTS public.journey_data (
    crn TEXT PRIMARY KEY REFERENCES public.raw_data(crn) ON DELETE CASCADE,
    current_task TEXT,
    current_subtask TEXT,
    is_closed BOOLEAN DEFAULT false,
    quoted_gmv NUMERIC,
    final_gmv NUMERIC,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- This table stores events related to the 'Recce' stage.
CREATE TABLE IF NOT EXISTS public.recce_data (
    event_id TEXT PRIMARY KEY,
    crn TEXT REFERENCES public.raw_data(crn) ON DELETE CASCADE,
    subtask TEXT,
    "user" TEXT,
    timestamp TIMESTAMPTZ,
    city TEXT,
    next_step_brief TEXT,
    next_step_eta TIMESTAMPTZ,
    date_of_recce TIMESTAMPTZ,
    attendee TEXT,
    recce_template_url TEXT,
    project_start_timeline TEXT,
    has_drawing BOOLEAN,
    drawing_file TEXT,
    architectural_preference TEXT,
    site_condition_notes TEXT,
    expected_closure_date TIMESTAMPTZ,
    expected_gmv NUMERIC,
    follow_up_number INTEGER,
    expected_action TEXT,
    mom TEXT,
    files TEXT
);

-- This table stores events related to the 'TDDM' stage.
CREATE TABLE IF NOT EXISTS public.tddm_data (
    event_id TEXT PRIMARY KEY,
    crn TEXT REFERENCES public.raw_data(crn) ON DELETE CASCADE,
    subtask TEXT,
    "user" TEXT,
    timestamp TIMESTAMPTZ,
    city TEXT,
    next_step_brief TEXT,
    next_step_eta TIMESTAMPTZ,
    tddm_date TIMESTAMPTZ,
    meeting_location TEXT,
    attendance TEXT,
    attendee_bnb TEXT,
    os_email TEXT,
    duration TEXT,
    expected_closure_date TIMESTAMPTZ,
    drawing_shared BOOLEAN,
    drawing_file TEXT,
    boq_shared BOOLEAN,
    bye_laws_discussed BOOLEAN,
    sample_flow_plans BOOLEAN,
    roi_discussed BOOLEAN,
    customer_likes TEXT,
    mom TEXT,
    expected_gmv NUMERIC,
    follow_up_number INTEGER,
    expected_action TEXT,
    files TEXT
);

-- This table stores events related to the 'Advance Meeting' stage.
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
    site_visit_date TIMESTAMPTZ,
    attendees TEXT,
    agreement_shared BOOLEAN,
    expected_signing_date TIMESTAMPTZ,
    concerns_raised TEXT,
    follow_up_number INTEGER,
    expected_action TEXT,
    files TEXT,
    expected_gmv NUMERIC
);

-- This table stores events related to the 'Closure' stage.
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
