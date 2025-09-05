-- This file contains SQL statements to ALTER existing tables in your Supabase project.
-- Run these in your Supabase SQL Editor to update your database schema.

-- Add Quoted and Final GMV columns to the main journey tracking table
ALTER TABLE public.journey_data ADD COLUMN IF NOT EXISTS quoted_gmv numeric;
ALTER TABLE public.journey_data ADD COLUMN IF NOT EXISTS final_gmv numeric;
COMMENT ON COLUMN public.journey_data.quoted_gmv IS 'The initial GMV quoted at the start of the journey.';
COMMENT ON COLUMN public.journey_data.final_gmv IS 'The final GMV agreed upon at the time of closure.';


-- Add GMV column to the advance_meeting table for the Negotiation stage
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS gmv numeric;
COMMENT ON COLUMN public.advance_meeting.gmv IS 'The GMV value recorded during a negotiation event.';


-- Add columns to raw_data that might be missing from older schemas
ALTER TABLE public.raw_data ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.raw_data ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.raw_data ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.raw_data ADD COLUMN IF NOT EXISTS gmv numeric;


-- Add columns to recce_data that might be missing
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS date_of_recce timestamptz;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS attendee text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS recce_template_url text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS project_start_timeline text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS customer_budget numeric;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS has_drawing boolean;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS drawing_file text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS architectural_preference text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS site_condition_notes text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS expected_closure_date timestamptz;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS next_step_brief text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS next_step_eta timestamptz;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS follow_up_number integer;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS expected_action text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS mom text;
ALTER TABLE public.recce_data ADD COLUMN IF NOT EXISTS files text;


-- Add columns to tddm_data that might be missing
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS next_step_brief text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS next_step_eta timestamptz;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS tddm_date timestamptz;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS meeting_location text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS attendance text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS attendee_bnb text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS os_email text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS expected_closure_date timestamptz;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS drawing_shared boolean;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS drawing_file text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS boq_shared boolean;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS bye_laws_discussed boolean;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS sample_flow_plans boolean;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS roi_discussed boolean;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS customer_likes text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS mom text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS follow_up_number integer;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS expected_action text;
ALTER TABLE public.tddm_data ADD COLUMN IF NOT EXISTS files text;


-- Add columns to advance_meeting that might be missing
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS next_step_brief text;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS next_step_eta timestamptz;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS negotiation_number integer;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS key_concern text;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS solution_recommends text;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS files text;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS site_visit_date timestamptz;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS attendees text;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS agreement_shared boolean;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS expected_signing_date timestamptz;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS concerns_raised text;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS follow_up_number integer;
ALTER TABLE public.advance_meeting ADD COLUMN IF NOT EXISTS expected_action text;


-- Add columns to closure_data that might be missing
ALTER TABLE public.closure_data ADD COLUMN IF NOT EXISTS confirmation_method text[];
ALTER TABLE public.closure_data ADD COLUMN IF NOT EXISTS files text;
ALTER TABLE public.closure_data ADD COLUMN IF NOT EXISTS agenda text;
