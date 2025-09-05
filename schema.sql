
-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema "extensions";

-- Table for raw lead data
create table
  public.raw_data (
    crn text not null,
    city text null,
    customer_name text null,
    customer_email text null,
    customer_phone text null,
    gmv numeric null,
    timestamp timestamp with time zone not null default now(),
    constraint raw_data_pkey primary key (crn)
  ) tablespace pg_default;

-- Table to track the current state of each journey
create table
  public.journey_data (
    crn text not null,
    current_task text not null,
    current_subtask text not null,
    is_closed boolean not null default false,
    timestamp timestamp with time zone not null default now(),
    quoted_gmv numeric null,
    final_gmv numeric null,
    constraint journey_data_pkey primary key (crn),
    constraint journey_data_crn_fkey foreign key (crn) references raw_data (crn)
  ) tablespace pg_default;

-- Table for all events in the 'Recce' stage
create table
  public.recce_data (
    event_id text not null,
    crn text not null,
    city text not null,
    subtask text not null,
    "user" text not null,
    timestamp timestamp with time zone not null,
    next_step_brief text null,
    next_step_eta timestamp with time zone null,
    date_of_recce timestamp with time zone null,
    attendee text null,
    recce_template_url text null,
    project_start_timeline text null,
    expected_gmv numeric null,
    has_drawing boolean null,
    drawing_file text null,
    architectural_preference text null,
    site_condition_notes text null,
    expected_closure_date timestamp with time zone null,
    follow_up_number integer null,
    expected_action text null,
    mom text null,
    files text null,
    constraint recce_data_pkey primary key (event_id),
    constraint recce_data_crn_fkey foreign key (crn) references raw_data (crn)
  ) tablespace pg_default;

-- Table for all events in the 'TDDM' stage
create table
  public.tddm_data (
    event_id text not null,
    crn text not null,
    city text not null,
    subtask text not null,
    "user" text not null,
    timestamp timestamp with time zone not null,
    next_step_brief text null,
    next_step_eta timestamp with time zone null,
    tddm_date timestamp with time zone null,
    meeting_location text null,
    attendance text null,
    attendee_bnb text null,
    os_email text null,
    duration text null,
    expected_closure_date timestamp with time zone null,
    expected_gmv numeric null,
    drawing_shared boolean null,
    drawing_file text null,
    boq_shared boolean null,
    bye_laws_discussed boolean null,
    sample_flow_plans boolean null,
    roi_discussed boolean null,
    customer_likes text null,
    mom text null,
    follow_up_number integer null,
    expected_action text null,
    files text null,
    constraint tddm_data_pkey primary key (event_id),
    constraint tddm_data_crn_fkey foreign key (crn) references raw_data (crn)
  ) tablespace pg_default;

-- Table for all events in the 'Advance Meeting' stage
create table
  public.advance_meeting (
    event_id text not null,
    crn text not null,
    city text not null,
    subtask text not null,
    "user" text not null,
    timestamp timestamp with time zone not null,
    next_step_brief text null,
    next_step_eta timestamp with time zone null,
    expected_gmv numeric null,
    negotiation_number integer null,
    key_concern text null,
    solution_recommends text null,
    site_visit_date timestamp with time zone null,
    attendees text null,
    agreement_shared boolean null,
    expected_signing_date timestamp with time zone null,
    concerns_raised text null,
    follow_up_number integer null,
    expected_action text null,
    files text null,
    constraint advance_meeting_data_pkey primary key (event_id),
    constraint advance_meeting_data_crn_fkey foreign key (crn) references raw_data (crn)
  ) tablespace pg_default;

-- Table for all events in the 'Closure' stage
create table
  public.closure_data (
    event_id text not null,
    crn text not null,
    city text not null,
    subtask text not null,
    "user" text not null,
    timestamp timestamp with time zone not null,
    confirmation_method text[] null,
    final_gmv numeric null,
    agenda text null,
    files text null,
    constraint closure_data_pkey primary key (event_id),
    constraint closure_data_crn_fkey foreign key (crn) references raw_data (crn)
  ) tablespace pg_default;

-- Enable Row Level Security for all tables
alter table public.raw_data enable row level security;
alter table public.journey_data enable row level security;
alter table public.recce_data enable row level security;
alter table public.tddm_data enable row level security;
alter table public.advance_meeting enable row level security;
alter table public.closure_data enable row level security;

-- Create policies to allow public access (adjust as needed for production)
create policy "Enable read access for all users" on public.raw_data for select using (true);
create policy "Enable insert for authenticated users" on public.raw_data for insert with check (true);
create policy "Enable update for authenticated users" on public.raw_data for update using (true);

create policy "Enable read access for all users" on public.journey_data for select using (true);
create policy "Enable insert for authenticated users" on public.journey_data for insert with check (true);
create policy "Enable update for authenticated users" on public.journey_data for update using (true);

create policy "Enable read access for all users" on public.recce_data for select using (true);
create policy "Enable insert for authenticated users" on public.recce_data for insert with check (true);

create policy "Enable read access for all users" on public.tddm_data for select using (true);
create policy "Enable insert for authenticated users" on public.tddm_data for insert with check (true);

create policy "Enable read access for all users" on public.advance_meeting for select using (true);
create policy "Enable insert for authenticated users" on public.advance_meeting for insert with check (true);

create policy "Enable read access for all users" on public.closure_data for select using (true);
create policy "Enable insert for authenticated users" on public.closure_data for insert with check (true);
