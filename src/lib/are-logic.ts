
import * as z from 'zod';

// --- TYPE DEFINITIONS ---

export const areCities = [
    'BLR', 'Bangalore', 'Blr Commercial', 'Mysore',
    'CHN', 'Chennai', 'CHN Commercial',
    'HYD', 'Hyderabad', 'Hyd Commercial',
    'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 
    'NCR - Delhi', 'NCR - Ghaziabad', 'NCR Commercial', 'NCR- Gurugram',
    'Pune', 'Pune Commercial'
];
export const areZoning = ['Residential', 'Commercial', 'Mixed', 'Agriculture', 'Industrial', 'PSP'];
export const arePlotAreas = ['<2000', '2000-5000', '5000-10000', '10000-15000', '15000-20000', '>20000'];
export const areRoadWidths = ['<30', '30-40', '40-50', '>50'];
export const areWillingnessToManage = ['High', 'Minimal', 'Zero'];

const assetTypesForScoring = ['PG', 'MRU', 'Office / Rental', 'Hotel', 'School'];
export const nearbyAssetTypes50m = ['PG', 'MRU', 'Office / Rental', 'Hotel', 'School', 'None'];
export const nearbyAssetTypes2km = ['Schools', 'Colleges', 'Hospitals', 'IT Parks', 'Offices (standalone Buildings)', 'Metro Station', 'Railway Station', 'Airport', 'None'];


export const areInputSchema = z.object({
  city: z.string().min(1, { message: "City is required." }),
  zoning: z.string().min(1, { message: "Zoning is required." }),
  plotArea: z.string().min(1, { message: "Plot Area is required." }),
  roadWidth: z.string().min(1, { message: "Road Width is required." }),
  assetType50m: z.array(z.string()).min(1, { message: "At least one Asset Type within 50m is required." }),
  assetType2km: z.array(z.string()).min(1, { message: "At least one Asset Type within 2km is required." }),
  willingnessToManage: z.string().min(1, { message: "Willingness to Manage is required." }),
});

export type AreInput = z.infer<typeof areInputSchema>;

export interface ScoreBreakdownItem {
    factor: string;
    score: number;
    remarks: string;
}

export interface RankedAsset {
    assetType: string;
    totalScore: number;
    isFeasible: boolean;
    remarks: string;
}

export interface AreResult {
    rankedAssets: RankedAsset[];
    breakdown: Record<string, ScoreBreakdownItem[]>;
}

// --- SCORING TABLES (0-5) ---

const plotAreaScores: Record<string, Record<string, number>> = {
  '<2000':       { 'PG': 5, 'MRU': 5, 'Office / Rental': 0, 'Hotel': 0, 'School': 0 },
  '2000-5000':   { 'PG': 5, 'MRU': 5, 'Office / Rental': 4, 'Hotel': 3, 'School': 0 },
  '5000-10000':  { 'PG': 3, 'MRU': 3, 'Office / Rental': 4, 'Hotel': 5, 'School': 1 },
  '10000-15000': { 'PG': 2, 'MRU': 2, 'Office / Rental': 5, 'Hotel': 5, 'School': 3 },
  '15000-20000': { 'PG': 1, 'MRU': 1, 'Office / Rental': 4, 'Hotel': 5, 'School': 4 },
  '>20000':      { 'PG': 1, 'MRU': 1, 'Office / Rental': 4, 'Hotel': 4, 'School': 5 },
};

const roadWidthScores: Record<string, Record<string, number>> = {
  '<30':    { 'PG': 5, 'MRU': 5, 'Office / Rental': 0, 'Hotel': 0, 'School': 0 },
  '30-40':  { 'PG': 5, 'MRU': 5, 'Office / Rental': 3, 'Hotel': 3, 'School': 0 },
  '40-50':  { 'PG': 2, 'MRU': 2, 'Office / Rental': 5, 'Hotel': 5, 'School': 0 },
  '>50':    { 'PG': 1, 'MRU': 1, 'Office / Rental': 4, 'Hotel': 4, 'School': 5 },
};

const assetType50mScores: Record<string, Record<string, number>> = {
  'PG':              { 'PG': 5, 'MRU': 4, 'Office / Rental': 2, 'Hotel': 1, 'School': 2 },
  'MRU':             { 'PG': 5, 'MRU': 5, 'Office / Rental': 4, 'Hotel': 1, 'School': 2 },
  'Office / Rental': { 'PG': 4, 'MRU': 4, 'Office / Rental': 5, 'Hotel': 3, 'School': 0 },
  'Hotel':           { 'PG': 0, 'MRU': 0, 'Office / Rental': 2, 'Hotel': 3, 'School': 0 },
  'School':          { 'PG': 3, 'MRU': 4, 'Office / Rental': 2, 'Hotel': 2, 'School': 1 },
  'None':            { 'PG': 3, 'MRU': 3, 'Office / Rental': 3, 'Hotel': 3, 'School': 3 },
};

const assetType2kmScores: Record<string, Record<string, number>> = {
  'Schools':                      { 'PG': 2, 'MRU': 3, 'Office / Rental': 0, 'Hotel': 2, 'School': 5 },
  'Colleges':                     { 'PG': 4, 'MRU': 4, 'Office / Rental': 0, 'Hotel': 2, 'School': 1 },
  'Hospitals':                    { 'PG': 0, 'MRU': 0, 'Office / Rental': 2, 'Hotel': 3, 'School': 0 },
  'IT Parks':                     { 'PG': 5, 'MRU': 5, 'Office / Rental': 3, 'Hotel': 4, 'School': 1 },
  'Offices (standalone Buildings)': { 'PG': 4, 'MRU': 4, 'Office / Rental': 5, 'Hotel': 3, 'School': 0 },
  'Metro Station':                { 'PG': 3, 'MRU': 3, 'Office / Rental': 3, 'Hotel': 1, 'School': 1 },
  'Railway Station':              { 'PG': 0, 'MRU': 0, 'Office / Rental': 0, 'Hotel': 5, 'School': 0 },
  'Airport':                      { 'PG': 0, 'MRU': 2, 'Office / Rental': 0, 'Hotel': 4, 'School': 0 },
  'None':                         { 'PG': 3, 'MRU': 3, 'Office / Rental': 3, 'Hotel': 3, 'School': 3 },
};

const willingnessToManageScores: Record<string, Record<string, number>> = {
  'High':    { 'PG': 3, 'MRU': 5, 'Office / Rental': 2, 'Hotel': 2, 'School': 5 },
  'Minimal': { 'PG': 5, 'MRU': 1, 'Office / Rental': 5, 'Hotel': 3, 'School': 5 },
  'Zero':    { 'PG': 5, 'MRU': 0, 'Office / Rental': 5, 'Hotel': 4, 'School': 4 },
};


// --- GOVERNMENT PERMISSIBILITY FILTER ---

const governmentPermissibility: Record<string, Record<string, string[]>> = {
    'PG': {
        '<30': [],
        '30-40': ['CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'Pune', 'Pune Commercial', 'Mysore', 'NCR - Faridabad', 'NCR - Delhi'],
        '40-50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Noida', 'NCR - Gurgaon', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
        '>50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Noida', 'NCR - Gurgaon', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
    },
    'MRU': {
        '<30': [],
        '30-40': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
        '40-50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
        '>50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
    },
    'Office / Rental': {
        '<30': [],
        '30-40': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
        '40-50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
        '>50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
    },
    'Hotel': {
        '<30': [],
        '30-40': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
        '40-50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
        '>50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
    },
    'School': {
        '<30': [],
        '30-40': [],
        '40-50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
        '>50': ['BLR', 'Bangalore', 'Blr Commercial', 'CHN', 'Chennai', 'CHN Commercial', 'HYD', 'Hyderabad', 'Hyd Commercial', 'NCR - Gurgaon', 'NCR - Noida', 'NCR - Faridabad', 'NCR - Delhi', 'NCR - Ghaziabad', 'Pune', 'Pune Commercial', 'Mysore'],
    },
};

function isPermitted(assetType: string, roadWidth: string, city: string): boolean {
    const rulesForAsset = governmentPermissibility[assetType];
    if (!rulesForAsset) {
        return false; // No rules defined for this asset type, assume not permitted.
    }
    const allowedCities = rulesForAsset[roadWidth];
    if (!allowedCities) {
        return false; // No rules for this specific road width.
    }
    return allowedCities.includes(city);
}


// --- CORE CALCULATION FUNCTION ---

export function calculateAreScore(input: AreInput): AreResult {
    const rankedAssets: RankedAsset[] = [];
    const breakdown: Record<string, ScoreBreakdownItem[]> = {};

    for (const assetType of assetTypesForScoring) {
        let totalScore = 0;
        const assetBreakdown: ScoreBreakdownItem[] = [];

        // Step 1: Government Permissibility Filter
        const permitted = isPermitted(assetType, input.roadWidth, input.city);
        if (!permitted) {
            rankedAssets.push({ assetType, totalScore: 0, isFeasible: false, remarks: `Not permissible in ${input.city} with a ${input.roadWidth} ft road.` });
            breakdown[assetType] = [{ factor: 'Government Constraints', score: 0, remarks: 'Not Permissible' }];
            continue;
        }

        // Step 2: Scoring
        const plotAreaScore = plotAreaScores[input.plotArea]?.[assetType] ?? 0;
        totalScore += plotAreaScore;
        assetBreakdown.push({ factor: 'Plot Area', score: plotAreaScore, remarks: `Suitability for ${input.plotArea} sq ft` });

        const roadWidthScore = roadWidthScores[input.roadWidth]?.[assetType] ?? 0;
        totalScore += roadWidthScore;
        assetBreakdown.push({ factor: 'Road Width', score: roadWidthScore, remarks: `Suitability for ${input.roadWidth} ft width` });
        
        // Handle multiple selections for assetType50m by summing scores
        let total50mScore = 0;
        if (input.assetType50m.length > 0) {
            for (const nearbyAsset of input.assetType50m) {
                 total50mScore += assetType50mScores[nearbyAsset]?.[assetType] ?? 0;
            }
        }
        
        totalScore += total50mScore;
        assetBreakdown.push({ factor: 'Nearby (50m)', score: total50mScore, remarks: `Synergy with ${input.assetType50m.join(', ')}` });

        // Handle multiple selections for assetType2km by summing scores
        let total2kmScore = 0;
        if (input.assetType2km.length > 0) {
             for (const nearbyAsset of input.assetType2km) {
                total2kmScore += assetType2kmScores[nearbyAsset]?.[assetType] ?? 0;
            }
        }
        
        totalScore += total2kmScore;
        assetBreakdown.push({ factor: 'Nearby (2km)', score: total2kmScore, remarks: `Synergy with ${input.assetType2km.join(', ')}` });

        const willingnessScore = willingnessToManageScores[input.willingnessToManage]?.[assetType] ?? 0;
        totalScore += willingnessScore;
        assetBreakdown.push({ factor: 'Willingness to Manage', score: willingnessScore, remarks: `Matches ${input.willingnessToManage} preference` });
        
        const finalScore = totalScore;

        rankedAssets.push({ assetType, totalScore: finalScore, isFeasible: true, remarks: `Permissible in ${input.city} @ ${input.roadWidth} ft road width` });
        breakdown[assetType] = assetBreakdown;
    }

    // Step 3: Ranking
    rankedAssets.sort((a, b) => b.totalScore - a.totalScore);

    return { rankedAssets, breakdown };
}

    