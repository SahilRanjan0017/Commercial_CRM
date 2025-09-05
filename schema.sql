-- This file contains the SQL statements to update your existing Supabase tables.
-- Running these queries will add the necessary columns without deleting your data.

-- Add expected_gmv to recce_data
ALTER TABLE public.recce_data
ADD COLUMN IF NOT EXISTS expected_gmv numeric;

-- Add expected_gmv to tddm_data
ALTER TABLE public.tddm_data
ADD COLUMN IF NOT EXISTS expected_gmv numeric;

-- Add expected_gmv to advance_meeting
ALTER TABLE public.advance_meeting
ADD COLUMN IF NOT EXISTS expected_gmv numeric;

-- Add final_gmv to closure_data
ALTER TABLE public.closure_data
ADD COLUMN IF NOT EXISTS final_gmv numeric;

-- Add quoted_gmv and final_gmv to journey_data
ALTER TABLE public.journey_data
ADD COLUMN IF NOT EXISTS quoted_gmv numeric,
ADD COLUMN IF NOT EXISTS final_gmv numeric;
