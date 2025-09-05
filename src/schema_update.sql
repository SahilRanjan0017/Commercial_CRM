-- Add expected_gmv to recce_data if it doesn't exist
ALTER TABLE public.recce_data
ADD COLUMN IF NOT EXISTS expected_gmv numeric;

-- Add expected_gmv to tddm_data if it doesn't exist
ALTER TABLE public.tddm_data
ADD COLUMN IF NOT EXISTS expected_gmv numeric;

-- Add expected_gmv to advance_meeting if it doesn't exist
ALTER TABLE public.advance_meeting
ADD COLUMN IF NOT EXISTS expected_gmv numeric;

-- Add final_gmv and quoted_gmv to journey_data if they don't exist
ALTER TABLE public.journey_data
ADD COLUMN IF NOT EXISTS quoted_gmv numeric,
ADD COLUMN IF NOT EXISTS final_gmv numeric;
