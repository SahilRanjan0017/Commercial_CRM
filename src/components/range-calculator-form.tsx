'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- FIXED DATA (UNCHANGED) ---

const assetClasses = ["PG", "School", "Hotel", "Hospital", "High Rise Residential"];
const foundationTypes = [
    "Isolated Foundation - upto 5' Depth",
    "Isolated Foundation - 5' - 8' Depth",
    "Isolated Foundation - 8' - upto 10' Depth",
    "Isolated Foundation + Tie Beam",
    "Combined Footing - Upto 5' Depth",
    "Combined Footing - 5' - 10' Depth",
    "Raft Foundation - Upto 5' Depth",
    "Pile Foundation - Upto 20' Depth",
    "Pile Foundation - Upto 30' Depth"
];

const assetCostsData: Record<string, Record<string, number>> = {
    "PG": { reinforcement: 3.5, doors: 90, electrical: 75, plumbing: 90, hvac: 125, masonry: 210, waterproofing: 40, painting: 100, flooring: 190 },
    "School": { reinforcement: 4.75, doors: 110, electrical: 90, plumbing: 75, hvac: 150, masonry: 185, waterproofing: 50, painting: 100, flooring: 205 },
    "Hotel": { reinforcement: 4.25, doors: 110, electrical: 90, plumbing: 90, hvac: 175, masonry: 190, waterproofing: 40, painting: 120, flooring: 225 },
    "Hospital": { reinforcement: 5.25, doors: 120, electrical: 100, plumbing: 100, hvac: 175, masonry: 210, waterproofing: 50, painting: 120, flooring: 225 },
    "High Rise Residential": { reinforcement: 4.25, doors: 105, electrical: 85, plumbing: 95, hvac: 100, masonry: 185, waterproofing: 30, painting: 90, flooring: 190 }
};

const foundationCostsData: Record<string, { foundation: number, otherStructure: number }> = {
    "Isolated Foundation - upto 5' Depth": { foundation: 250, otherStructure: 210 },
    "Isolated Foundation - 5' - 8' Depth": { foundation: 285, otherStructure: 225 },
    "Isolated Foundation - 8' - upto 10' Depth": { foundation: 320, otherStructure: 240 },
    "Isolated Foundation + Tie Beam": { foundation: 345, otherStructure: 255 },
    "Combined Footing - Upto 5' Depth": { foundation: 320, otherStructure: 240 },
    "Combined Footing - 5' - 10' Depth": { foundation: 360, otherStructure: 260 },
    "Raft Foundation - Upto 5' Depth": { foundation: 380, otherStructure: 310 },
    "Pile Foundation - Upto 20' Depth": { foundation: 470, otherStructure: 370 },
    "Pile Foundation - Upto 30' Depth": { foundation: 550, otherStructure: 450 }
};

const GST_RATE = 0.18;

// --- INITIAL STATE & TYPES ---

type FloorData = {
    key: string; // Unique key: B1, GF, 1F, TF
    type: 'Basement' | 'GF' | 'Intermediate' | 'TF';
    name: string;
    area: string;
    height: string; // Stored in meters
};

const initialInputs = {
    assetClass: 'High Rise Residential',
    numBasements: '1', // Dynamic input
    numIntermediateFloors: '4', // Dynamic input (The 'x' in G+x+T)
    buildingHeightM: '18.00',
    foundationType: "Raft Foundation - Upto 5' Depth",
    windowsVentilatorsPercent: '10',
    msRailingsPercent: '12',
    windowGrillsPercent: '10',
    elevationCost: true,
    cctv: true,
    hvacLowside: true,
    sprinklers: true,
    transformerCapacity: '500',
    dgCapacity: '250',
    ups: true,
    lift: true,
    hvacHighside: false,
    stpCapacity: '0',
    ohtCapacity: '0',
    ugSumpCapacity: '0',
    motorsNos: '8',
    externalDrainage: false,
    roadsDrains: false,
    hardscape: false,
    softscape: false,
    entranceArch: false,
};

const defaultResults = {
    totalBuiltupArea: 0,
    subTotalCost: 0,
    grandTotalCost: 0,
    costSummary: {} as Record<string, number>,
    totalStructureCost: 0,
    totalFinishesCost: 0,
    totalJoineriesCost: 0,
    totalFabricationCost: 0,
    totalFacadeCost: 0,
    totalMEPLowsideCost: 0,
    totalOtherMEPLowsideCost: 0,
    totalElectricalHighsideCost: 0,
    totalPlumbingHighsideCost: 0,
    totalFireFightingCost: 0,
    totalExternalDevelopmentCost: 0,
};

// --- CORE COMPONENT ---

export function RangeCalculatorForm() {
    const [deck, setDeck] = useState(1);
    const [inputs, setInputs] = useState(initialInputs);
    const [floors, setFloors] = useState<FloorData[]>([]);
    const [results, setResults] = useState(defaultResults);

    // --- DYNAMIC FLOOR GENERATION ---

    const generateFloors = useCallback((currentInputs: typeof initialInputs) => {
        const numB = parseInt(currentInputs.numBasements, 10) || 0;
        const numI = parseInt(currentInputs.numIntermediateFloors, 10) || 0;
        
        // Use a persistent map to retain user-entered values
        const floorValueMap = new Map(floors.map(f => [f.key, f]));

        let newFloors: FloorData[] = [];

        // 1. Basements
        for (let i = numB; i >= 1; i--) {
            const key = `B${i}`;
            const existing = floorValueMap.get(key);
            newFloors.push({
                key,
                type: 'Basement',
                name: `Basement ${i}`,
                area: existing?.area || '',
                height: existing?.height || '',
            });
        }

        // 2. Ground Floor (GF)
        const gfKey = 'GF';
        const existingGF = floorValueMap.get(gfKey);
        newFloors.push({
            key: gfKey,
            type: 'GF',
            name: 'GF',
            area: existingGF?.area || '',
            height: existingGF?.height || '3.50',
        });

        // 3. Intermediate Floors (1F, 2F, ...)
        for (let i = 1; i <= numI; i++) {
            const key = `${i}F`;
            const existing = floorValueMap.get(key);
            newFloors.push({
                key,
                type: 'Intermediate',
                name: `${i}F`,
                area: existing?.area || '',
                height: existing?.height || '3.50',
            });
        }

        // 4. Top Floor (TF)
        const tfKey = 'TF';
        const existingTF = floorValueMap.get(tfKey);
        newFloors.push({
            key: tfKey,
            type: 'TF',
            name: 'TF',
            area: existingTF?.area || '',
            height: existingTF?.height || '', // Height is often irrelevant for TF
        });

        // Apply initial sample data if floors are empty
        if (newFloors.length > 0 && newFloors.every(f => !f.area && !f.height)) {
            // Apply sample data based on the prompt's example
            const sampleData: Record<string, { area: string, height: string }> = {
                'B1': { area: '7225.00', height: '3.00' },
                'GF': { area: '7225.00', height: '3.50' },
                '1F': { area: '7225.00', height: '3.50' },
                '2F': { area: '7225.00', height: '3.50' },
                '3F': { area: '7225.00', height: '3.75' },
                '4F': { area: '7225.00', height: '3.75' },
                'TF': { area: '250.00', height: '' },
            };

            newFloors = newFloors.map(f => {
                const sample = sampleData[f.key];
                return sample ? { ...f, area: sample.area, height: sample.height } : f;
            });
        }

        return newFloors;
    }, [floors]);


    // Initial floor setup and listener for numBasements/numIntermediateFloors change
    useState(() => {
        setFloors(generateFloors(initialInputs));
    });

    // --- HANDLERS ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        setInputs(prev => {
            const newInputs = { ...prev, [id]: val };
            
            // Re-generate floors if floor counts change
            if (id === 'numBasements' || id === 'numIntermediateFloors') {
                setFloors(generateFloors(newInputs));
            }
            
            return newInputs;
        });
    };

    const handleSelectChange = (id: string, value: string | boolean) => {
        setInputs(prev => ({ ...prev, [id]: value }));
    };

    const handleFloorInputChange = (key: string, field: 'area' | 'height', value: string) => {
        setFloors(prevFloors => 
            prevFloors.map(f => 
                f.key === key ? { ...f, [field]: value } : f
            )
        );
    };

    // --- CALCULATIONS (Updated to use the new floor structure) ---

    const calculateTotalBuiltupArea = useCallback(() => {
        return floors.reduce((acc, f) => acc + (parseFloat(f.area) || 0), 0);
    }, [floors]);

    const calculateTotalBasementHeight = useCallback(() => {
        return floors
            .filter(f => f.type === 'Basement')
            .reduce((acc, f) => acc + (parseFloat(f.height) || 0), 0);
    }, [floors]);

    const calculateCost = () => {
        const totalBuiltupArea = calculateTotalBuiltupArea();
        if (totalBuiltupArea <= 0) {
            setResults(defaultResults);
            setDeck(3);
            return;
        }

        const assetCost = assetCostsData[inputs.assetClass as keyof typeof assetCostsData];
        const foundationCostInfo = foundationCostsData[inputs.foundationType as keyof typeof foundationCostsData];
        
        let costs: Record<string, number> = {};

        // 1.00 Structure
        costs["Foundation"] = foundationCostInfo.foundation;
        costs["Reinforcement - in kgs / Sqft"] = assetCost.reinforcement * 80;
        costs["Other Structure Works"] = foundationCostInfo.otherStructure;
        
        const totalStructureCost = costs["Foundation"] + costs["Reinforcement - in kgs / Sqft"] + costs["Other Structure Works"];

        // 2.00 Finishes
        costs["Masonry & Plastering"] = assetCost.masonry;
        costs["Waterproofing"] = assetCost.waterproofing;
        costs["Flooring"] = assetCost.flooring;
        costs["Painting"] = assetCost.painting;
        
        const totalFinishesCost = costs["Masonry & Plastering"] + costs["Waterproofing"] + costs["Flooring"] + costs["Painting"];
        
        // 3.00 Joineries
        const windowsVentilatorsPercentage = parseFloat(inputs.windowsVentilatorsPercent) / 100 || 0;
        costs["Doors - On Total Builtup Area"] = assetCost.doors;
        costs["Windows & Ventilators - On Total Builtup Area"] = windowsVentilatorsPercentage * 500; 
        
        const totalJoineriesCost = costs["Doors - On Total Builtup Area"] + costs["Windows & Ventilators - On Total Builtup Area"];

        // 4.00 Fabrication Works
        const msRailingsPercentage = parseFloat(inputs.msRailingsPercent) / 100 || 0;
        const windowGrillsPercentage = parseFloat(inputs.windowGrillsPercent) / 100 || 0;
        costs["MS Railings - On Total Builtup Area"] = msRailingsPercentage * 300; 
        costs["Window Grills - On Total Builtup Area"] = windowGrillsPercentage * 250; 
        
        const totalFabricationCost = costs["MS Railings - On Total Builtup Area"] + costs["Window Grills - On Total Builtup Area"];

        // 5.00 Facade Works
        costs["Elevation Cost - Lumpsum Cost Based on Requirement"] = inputs.elevationCost ? 175 : 0;
        
        const totalFacadeCost = costs["Elevation Cost - Lumpsum Cost Based on Requirement"];

        // 6.00 MEP Lowside Works
        costs["Electrical (Lowside)"] = assetCost.electrical;
        costs["Plumbing (Lowside)"] = assetCost.plumbing;
        costs["HVAC (Lowside)"] = inputs.hvacLowside ? assetCost.hvac : 0;
        
        const totalMEPLowsideCost = costs["Electrical (Lowside)"] + costs["Plumbing (Lowside)"] + costs["HVAC (Lowside)"];
        
        // 7.00 Other MEP Lowside Works
        costs["Fire Fighting - Hydrant System"] = 25; 
        costs["CCTV, Access Control, PA System, FA System, etc."] = inputs.cctv ? 50 : 0;
        
        const totalOtherMEPLowsideCost = costs["Fire Fighting - Hydrant System"] + costs["CCTV, Access Control, PA System, FA System, etc."];

        // 8.00 Electrical - Highside Works
        const transformerCapacity = parseFloat(inputs.transformerCapacity) || 0;
        const dgCapacity = parseFloat(inputs.dgCapacity) || 0;
        costs["Transformer Capacity"] = (transformerCapacity * 3000) / totalBuiltupArea;
        costs["DG Capacity"] = (dgCapacity * 15000) / totalBuiltupArea;
        costs["UPS / Other High Side"] = inputs.ups ? 50 : 0;
        costs["Lift"] = inputs.lift ? 75 : 0;
        costs["HVAC (Highside)"] = inputs.hvacHighside ? 120 : 0;
        
        const totalElectricalHighsideCost = costs["Transformer Capacity"] + costs["DG Capacity"] + costs["UPS / Other High Side"] + costs["Lift"] + costs["HVAC (Highside)"];
        
        // 9.00 Plumbing
        const stpCapacity = parseFloat(inputs.stpCapacity) || 0;
        const ohtCapacity = parseFloat(inputs.ohtCapacity) || 0;
        const ugSumpCapacity = parseFloat(inputs.ugSumpCapacity) || 0;
        const motorsNos = parseFloat(inputs.motorsNos) || 0;

        costs["STP Capacity"] = (stpCapacity * 30) / totalBuiltupArea;
        costs["OHT Capacity"] = (ohtCapacity * 20) / totalBuiltupArea;
        costs["UG Sump Capacity"] = (ugSumpCapacity * 30) / totalBuiltupArea;
        costs["Motors"] = (motorsNos * 120000) / totalBuiltupArea;
        costs["External Drainage System"] = inputs.externalDrainage ? 90 : 40;
        
        const totalPlumbingHighsideCost = costs["STP Capacity"] + costs["OHT Capacity"] + costs["UG Sump Capacity"] + costs["Motors"] + costs["External Drainage System"];

        // 10.00 Fire Fighting
        costs["Sprinklers"] = inputs.sprinklers ? 50 : 0;

        const totalFireFightingCost = costs["Sprinklers"];

        // 11.00 External Development
        costs["Roads & External Drains"] = inputs.roadsDrains ? 120 : 0;
        costs["Hardscape"] = inputs.hardscape ? 100 : 0;
        costs["Softscape"] = inputs.softscape ? 80 : 0;
        costs["Entrance Arch"] = inputs.entranceArch ? 70 : 0;
        
        const totalExternalDevelopmentCost = costs["Roads & External Drains"] + costs["Hardscape"] + costs["Softscape"] + costs["Entrance Arch"];
        
        // --- SUMMARY CALCULATION ---

        const allCosts = Object.values(costs);
        const totalCostPerSqft = allCosts.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
        const subTotal = totalBuiltupArea * totalCostPerSqft;

        setResults({
            totalBuiltupArea: totalBuiltupArea,
            subTotalCost: subTotal,
            grandTotalCost: subTotal * (1 + GST_RATE),
            costSummary: costs,
            totalStructureCost,
            totalFinishesCost,
            totalJoineriesCost,
            totalFabricationCost,
            totalFacadeCost,
            totalMEPLowsideCost,
            totalOtherMEPLowsideCost,
            totalElectricalHighsideCost,
            totalPlumbingHighsideCost,
            totalFireFightingCost,
            totalExternalDevelopmentCost,
        });

        setDeck(3);
    };

    // Calculate the number of floors (G+x+T format) for display
    const floorsDisplayString = useMemo(() => {
        const floorAreas = floors.filter(f => (parseFloat(f.area) || 0) > 0);
        const basementCount = floorAreas.filter(f => f.type === 'Basement').length;
        const groundFloor = floorAreas.find(f => f.type === 'GF');
        const topFloor = floorAreas.find(f => f.type === 'TF');
        const intermediateFloors = floorAreas.filter(f => f.type === 'Intermediate');
        
        let display = '';
        if (groundFloor) {
            display += 'G';
        }

        if (intermediateFloors.length > 0) {
            display += `+${intermediateFloors.length}`;
        }

        if (topFloor) {
            display += '+T';
        }

        if (basementCount > 0) {
            // Display Bx, where x is the number of basements
            display += ` (B${basementCount})`;
        }
        
        return display || 'N/A';
    }, [floors]);


    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-extrabold text-center text-blue-700">🏗️ Project Cost Range Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* --- DECK 1: INPUTS (FLOOR & BASIC) --- */}
                    {deck === 1 && (
                        <div>
                            <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Deck 1: Project & Floor Inputs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div>
                                    <Label htmlFor="assetClass" className="font-semibold">Asset Class</Label>
                                    <Select value={inputs.assetClass} onValueChange={(v) => handleSelectChange('assetClass', v)}>
                                        <SelectTrigger id="assetClass"><SelectValue /></SelectTrigger>
                                        <SelectContent>{assetClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="buildingHeightM" className="font-semibold">Building Height (in meters)</Label>
                                    <Input type="number" id="buildingHeightM" value={inputs.buildingHeightM} onChange={handleInputChange} placeholder="e.g., 18.00" min="0" />
                                </div>
                                <div>
                                    <Label htmlFor="foundationType" className="font-semibold">Foundation Type</Label>
                                    <Select value={inputs.foundationType} onValueChange={(v) => handleSelectChange('foundationType', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{foundationTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <h4 className="text-xl font-semibold mb-4 text-blue-600">Structure Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 border rounded-lg bg-gray-50">
                                <div>
                                    <Label htmlFor="numBasements" className="font-semibold">Number of Basements (B)</Label>
                                    <Input type="number" id="numBasements" value={inputs.numBasements} onChange={handleInputChange} min="0" max="6" />
                                </div>
                                <div>
                                    <Label htmlFor="numIntermediateFloors" className="font-semibold">Number of Floors (X in G+X+T)</Label>
                                    <Input type="number" id="numIntermediateFloors" value={inputs.numIntermediateFloors} onChange={handleInputChange} min="0" max="10" />
                                </div>
                            </div>

                            <h4 className="text-xl font-semibold mb-4 text-blue-600">Floor-wise Area & Height (Sqft & Meters)</h4>
                            <div className="grid grid-cols-4 gap-4 bg-gray-100 p-3 rounded-t-lg font-bold border-b">
                                <span>Floor Type</span>
                                <span>Area (Sqft)</span>
                                <span>Height (m)</span>
                                <span>Total Built-up (Current)</span>
                            </div>
                            {floors.map((f) => (
                                <div key={f.key} className={`grid grid-cols-4 gap-4 py-2 border-b ${f.type === 'Basement' ? 'bg-yellow-50' : f.type === 'GF' || f.type === 'TF' ? 'bg-indigo-50' : ''}`}>
                                    <span className="font-medium self-center">{f.name}</span>
                                    <Input 
                                        type="number" 
                                        value={f.area} 
                                        onChange={(e) => handleFloorInputChange(f.key, 'area', e.target.value)} 
                                        placeholder="Area (Sqft)" 
                                        min="0"
                                    />
                                    <Input 
                                        type="number" 
                                        value={f.height} 
                                        onChange={(e) => handleFloorInputChange(f.key, 'height', e.target.value)} 
                                        placeholder="Height (m)" 
                                        min="0"
                                        disabled={f.type === 'TF'}
                                    />
                                    <span className="self-center text-right pr-2 font-mono">{(parseFloat(f.area) || 0).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="grid grid-cols-4 gap-4 pt-3 font-bold text-lg bg-gray-100 p-3 rounded-b-lg mt-0">
                                <span>TOTAL:</span>
                                <span></span>
                                <span></span>
                                <span className="text-right pr-2 text-green-700">{calculateTotalBuiltupArea().toFixed(2)} Sqft</span>
                            </div>

                            <div className="flex justify-end mt-8"><Button onClick={() => setDeck(2)}>Next: Detailed Costs</Button></div>
                        </div>
                    )}

                    {/* --- DECK 2 & 3 (REMAIN UNCHANGED) --- */}
                    {deck === 2 && (
                        <div>
                            <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Deck 2: Detailed Cost Parameters</h3>
                            
                            {/* Joineries & Fabrication */}
                            <div className="space-y-4 mb-8 p-4 border rounded-lg bg-indigo-50">
                                <h4 className="font-bold text-lg text-indigo-800">Joineries & Fabrication Percentage Inputs</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><Label htmlFor="windowsVentilatorsPercent">Windows & Ventilators %</Label><Input type="number" id="windowsVentilatorsPercent" value={inputs.windowsVentilatorsPercent} onChange={handleInputChange} min="0" max="100" /></div>
                                    <div><Label htmlFor="msRailingsPercent">MS Railings %</Label><Input type="number" id="msRailingsPercent" value={inputs.msRailingsPercent} onChange={handleInputChange} min="0" max="100" /></div>
                                    <div><Label htmlFor="windowGrillsPercent">Window Grills %</Label><Input type="number" id="windowGrillsPercent" value={inputs.windowGrillsPercent} onChange={handleInputChange} min="0" max="100" /></div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Facade Works */}
                                <div><h4 className="font-bold text-lg text-gray-700 border-b pb-1">Facade Works</h4>
                                    <div className="flex items-center space-x-2 mt-2"><Checkbox id="elevationCost" checked={inputs.elevationCost} onCheckedChange={(c) => handleSelectChange('elevationCost', c as boolean)} /><label htmlFor="elevationCost" className="text-sm font-medium leading-none">Elevation Cost (₹175/0)</label></div>
                                </div>

                                {/* MEP Lowside */}
                                <div><h4 className="font-bold text-lg text-gray-700 border-b pb-1">MEP Lowside Works (HVAC & Other)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                        <div className="flex items-center space-x-2"><Checkbox id="hvacLowside" checked={inputs.hvacLowside} onCheckedChange={(c) => handleSelectChange('hvacLowside', c as boolean)} /><label htmlFor="hvacLowside" className="text-sm font-medium leading-none">HVAC (Lowside)</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="cctv" checked={inputs.cctv} onCheckedChange={(c) => handleSelectChange('cctv', c as boolean)} /><label htmlFor="cctv" className="text-sm font-medium leading-none">CCTV, Access Control, PA/FA System (₹50/0)</label></div>
                                    </div>
                                </div>
                                
                                {/* Electrical - Highside Works */}
                                <div><h4 className="font-bold text-lg text-gray-700 border-b pb-1">Electrical - Highside Works</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div><Label htmlFor="transformerCapacity">Transformer Capacity (kVa)</Label><Input type="number" id="transformerCapacity" value={inputs.transformerCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div><Label htmlFor="dgCapacity">DG Capacity (kVa)</Label><Input type="number" id="dgCapacity" value={inputs.dgCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="ups" checked={inputs.ups} onCheckedChange={(c) => handleSelectChange('ups', c as boolean)} /><label htmlFor="ups" className="text-sm font-medium leading-none">UPS / Other High Side (₹50/0)</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="lift" checked={inputs.lift} onCheckedChange={(c) => handleSelectChange('lift', c as boolean)} /><label htmlFor="lift" className="text-sm font-medium leading-none">Lift (₹75/0)</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="hvacHighside" checked={inputs.hvacHighside} onCheckedChange={(c) => handleSelectChange('hvacHighside', c as boolean)} /><label htmlFor="hvacHighside" className="text-sm font-medium leading-none">HVAC (Highside) (₹120/0)</label></div>
                                    </div>
                                </div>
                                
                                {/* Plumbing */}
                                <div><h4 className="font-bold text-lg text-gray-700 border-b pb-1">Plumbing</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div><Label htmlFor="stpCapacity">STP - Capacity (Ltrs)</Label><Input type="number" id="stpCapacity" value={inputs.stpCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div><Label htmlFor="ohtCapacity">OHT - Capacity (Ltrs)</Label><Input type="number" id="ohtCapacity" value={inputs.ohtCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div><Label htmlFor="ugSumpCapacity">UG Sump - Capacity (Ltrs)</Label><Input type="number" id="ugSumpCapacity" value={inputs.ugSumpCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div><Label htmlFor="motorsNos">Motors - (Nos.)</Label><Input type="number" id="motorsNos" value={inputs.motorsNos} onChange={handleInputChange} min="0" /></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="externalDrainage" checked={inputs.externalDrainage} onCheckedChange={(c) => handleSelectChange('externalDrainage', c as boolean)} /><label htmlFor="externalDrainage" className="text-sm font-medium leading-none">External Drainage System (₹90/40)</label></div>
                                    </div>
                                </div>

                                {/* Fire Fighting */}
                                <div><h4 className="font-bold text-lg text-gray-700 border-b pb-1">Fire Fighting</h4>
                                    <div className="flex items-center space-x-2 mt-2"><Checkbox id="sprinklers" checked={inputs.sprinklers} onCheckedChange={(c) => handleSelectChange('sprinklers', c as boolean)} /><label htmlFor="sprinklers" className="text-sm font-medium leading-none">Sprinklers (₹50/0)</label></div>
                                </div>
                                
                                {/* External Development */}
                                <div><h4 className="font-bold text-lg text-gray-700 border-b pb-1">External Development</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div className="flex items-center space-x-2"><Checkbox id="roadsDrains" checked={inputs.roadsDrains} onCheckedChange={(c) => handleSelectChange('roadsDrains', c as boolean)} /><label htmlFor="roadsDrains" className="text-sm font-medium leading-none">Roads & External Drains (₹120/0)</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="hardscape" checked={inputs.hardscape} onCheckedChange={(c) => handleSelectChange('hardscape', c as boolean)} /><label htmlFor="hardscape" className="text-sm font-medium leading-none">Hardscape (₹100/0)</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="softscape" checked={inputs.softscape} onCheckedChange={(c) => handleSelectChange('softscape', c as boolean)} /><label htmlFor="softscape" className="text-sm font-medium leading-none">Softscape (₹80/0)</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="entranceArch" checked={inputs.entranceArch} onCheckedChange={(c) => handleSelectChange('entranceArch', c as boolean)} /><label htmlFor="entranceArch" className="text-sm font-medium leading-none">Entrance Arch (₹70/0)</label></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                <Button variant="secondary" onClick={() => setDeck(1)}>Back: Project Inputs</Button>
                                <Button onClick={calculateCost}>Calculate Cost</Button>
                            </div>
                        </div>
                    )}

                    {deck === 3 && (
                        <div>
                            <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Deck 3: Final Cost Summary</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg bg-green-50">
                                <p className="text-xl"><strong>Type of Structure:</strong> <span className='font-semibold text-blue-700'>{inputs.assetClass}</span></p>
                                <p className="text-xl"><strong>No. of Floors:</strong> <span className='font-semibold text-blue-700'>{floorsDisplayString}</span></p>
                                <p className="text-xl"><strong>Building Height:</strong> <span className='font-semibold text-blue-700'>{inputs.buildingHeightM} m</span></p>
                                <p className="text-xl"><strong>Total Built-up Area:</strong> <span className='font-semibold text-blue-700'>{results.totalBuiltupArea.toFixed(2)} Sqft</span></p>
                                <p className="text-2xl font-extrabold text-red-700">Sub Total Cost (w/o GST):</p>
                                <p className="text-2xl font-extrabold text-red-700">₹{(results.subTotalCost / results.totalBuiltupArea).toFixed(0)} / Sqft</p>
                            </div>

                            <div className="mb-8 p-4 border rounded-lg bg-red-50">
                                <p className="text-3xl font-extrabold text-center text-red-800">Grand Total Cost (with GST): ₹{results.grandTotalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                <p className="text-xl font-extrabold text-center text-red-800">Grand Total Cost (Per Sqft): ₹{(results.grandTotalCost / results.totalBuiltupArea).toFixed(0)}</p>
                            </div>
                            
                            {/* Detailed Cost Breakdown Table (Condensed for brevity) */}
                            <h4 className="text-xl font-bold mb-3 text-gray-700">Detailed Cost / Sqft Breakdown</h4>
                            <div className="overflow-x-auto">
                                <Table className='border'>
                                    <TableHeader className='bg-blue-100'>
                                        <TableRow>
                                            <TableHead className="font-bold">S No</TableHead>
                                            <TableHead className="font-bold">Descriptions</TableHead>
                                            <TableHead className="font-bold text-right">Total Cost / Sqft</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>1.00</TableCell><TableCell>Structure</TableCell><TableCell className="text-right">₹{results.totalStructureCost.toFixed(2)}</TableCell></TableRow>
                                        {Object.entries(results.costSummary).filter(([key]) => ["Foundation", "Reinforcement - in kgs / Sqft", "Other Structure Works"].includes(key)).map(([key, value]) => (<TableRow key={key}><TableCell></TableCell><TableCell className="pl-6">{key}</TableCell><TableCell className="text-right">₹{value.toFixed(2)}</TableCell></TableRow>))}
                                        
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>2.00</TableCell><TableCell>Finishes</TableCell><TableCell className="text-right">₹{results.totalFinishesCost.toFixed(2)}</TableCell></TableRow>
                                        {/* ... (Other sections follow similar pattern) ... */}
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>3.00</TableCell><TableCell>Joineries</TableCell><TableCell className="text-right">₹{results.totalJoineriesCost.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>4.00</TableCell><TableCell>Fabrication Works</TableCell><TableCell className="text-right">₹{results.totalFabricationCost.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>5.00</TableCell><TableCell>Facade Works</TableCell><TableCell className="text-right">₹{results.totalFacadeCost.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>6.00</TableCell><TableCell>MEP Lowside Works</TableCell><TableCell className="text-right">₹{results.totalMEPLowsideCost.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>7.00</TableCell><TableCell>Other MEP Lowside Works</TableCell><TableCell className="text-right">₹{results.totalOtherMEPLowsideCost.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>8.00</TableCell><TableCell>Electrical - Highside Works</TableCell><TableCell className="text-right">₹{results.totalElectricalHighsideCost.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>9.00</TableCell><TableCell>Plumbing Highside</TableCell><TableCell className="text-right">₹{results.totalPlumbingHighsideCost.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>10.00</TableCell><TableCell>Fire Fighting</TableCell><TableCell className="text-right">₹{results.totalFireFightingCost.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className='bg-gray-200 font-bold'><TableCell>11.00</TableCell><TableCell>External Development</TableCell><TableCell className="text-right">₹{results.totalExternalDevelopmentCost.toFixed(2)}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button variant="secondary" onClick={() => setDeck(2)}>Back to Detailed Costs</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}