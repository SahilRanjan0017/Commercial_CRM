
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    "PG": { reinforcement: 3.5, doors: 90, electrical: 75, plumbing: 90, hvac: 125, masonry: 200, waterproofing: 40, painting: 100, flooring: 175 },
    "School": { reinforcement: 4.75, doors: 110, electrical: 90, plumbing: 75, hvac: 150, masonry: 175, waterproofing: 50, painting: 100, flooring: 190 },
    "Hotel": { reinforcement: 4.25, doors: 110, electrical: 90, plumbing: 90, hvac: 175, masonry: 180, waterproofing: 40, painting: 120, flooring: 210 },
    "Hospital": { reinforcement: 5.25, doors: 120, electrical: 100, plumbing: 100, hvac: 175, masonry: 200, waterproofing: 50, painting: 120, flooring: 210 },
    "High Rise Residential": { reinforcement: 4.25, doors: 105, electrical: 85, plumbing: 95, hvac: 100, masonry: 175, waterproofing: 30, painting: 90, flooring: 175 }
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

export function RangeCalculatorForm() {
    const [deck, setDeck] = useState(1);
    const [inputs, setInputs] = useState({
        assetClass: 'PG',
        plotArea: '',
        effectiveArea: '',
        numFloors: '',
        numBasements: '0',
        basements: [] as { area: string, height: string }[],
        fullHeight: '',
        foundationType: "Isolated Foundation - upto 5' Depth",
        elevationCost: false,
        cctv: false,
        transformerCapacity: '250',
        dgCapacity: '40',
        ups: false,
        lift: false,
        hvacHighside: false,
        stpCapacity: '10000',
        ohtCapacity: '40000',
        ugSumpCapacity: '80000',
        motorsNos: '5',
        externalDrainage: false,
        roadsDrains: false,
        hardscape: false,
        softscape: false,
        entranceArch: false,
    });
    const [results, setResults] = useState({
        totalBuiltupArea: 0,
        subTotalCost: 0,
        grandTotalCost: 0,
        costSummary: {} as Record<string, number>
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        
        setInputs(prev => {
            const newInputs = { ...prev, [id]: val };
            if (id === 'plotArea') {
                const plotAreaValue = parseFloat(value) || 0;
                newInputs.effectiveArea = (plotAreaValue - (plotAreaValue * 0.15)).toFixed(2);
            }
            return newInputs;
        });
    };

    const handleSelectChange = (id: string, value: string | boolean) => {
        setInputs(prev => ({ ...prev, [id]: value }));
    };

    const handleNumBasementsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = parseInt(e.target.value, 10) || 0;
        setInputs(prev => ({
            ...prev,
            numBasements: e.target.value,
            basements: Array(num).fill({ area: '', height: '' })
        }));
    };

    const handleBasementInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newBasements = [...inputs.basements];
        newBasements[index] = { ...newBasements[index], [name]: value };
        setInputs(prev => ({ ...prev, basements: newBasements }));
    };
    
    const calculateTotalBuiltupArea = () => {
        const plotArea = parseFloat(inputs.plotArea) || 0;
        const numFloors = parseFloat(inputs.numFloors) || 0;
        let totalBuiltupArea = 0;
        const groundFloorArea = plotArea > 0 ? plotArea * 0.765 : 0;
        
        if (plotArea > 0) {
            totalBuiltupArea += groundFloorArea; // GF
            totalBuiltupArea += groundFloorArea * numFloors; // Floors 1 to x
            totalBuiltupArea += plotArea * 0.25; // Top Floor
        }
        
        inputs.basements.forEach(basement => {
            totalBuiltupArea += parseFloat(basement.area) || 0;
        });

        return totalBuiltupArea;
    };

    const calculateCost = () => {
        const totalBuiltupArea = calculateTotalBuiltupArea();
        if (totalBuiltupArea <= 0) {
            setResults({ totalBuiltupArea: 0, subTotalCost: 0, grandTotalCost: 0, costSummary: {} });
            setDeck(3);
            return;
        }

        const assetCost = assetCostsData[inputs.assetClass as keyof typeof assetCostsData];
        const foundationCostInfo = foundationCostsData[inputs.foundationType as keyof typeof foundationCostsData];
        const fullHeight = parseFloat(inputs.fullHeight) || 0;
        const numBasements = parseInt(inputs.numBasements, 10) || 0;
        const totalBasementHeight = inputs.basements.reduce((acc, b) => acc + (parseFloat(b.height) || 0), 0);
        
        let costs: Record<string, number> = {};
        
        costs["Foundation"] = foundationCostInfo.foundation;
        costs["Reinforcement"] = assetCost.reinforcement * 80;
        costs["Other Structure Works"] = foundationCostInfo.otherStructure;
        costs["Masonry & Plastering"] = assetCost.masonry;
        costs["Waterproofing"] = assetCost.waterproofing;
        costs["Flooring"] = assetCost.flooring;
        costs["Painting"] = assetCost.painting;
        costs["Doors"] = assetCost.doors;
        costs["Windows & Ventilators"] = 60;
        costs["MS Railings"] = 30;
        costs["Window Grills"] = 30;
        costs["Elevation Cost"] = inputs.elevationCost ? 175 : 0;
        costs["Electrical (Lowside)"] = assetCost.electrical;
        costs["Plumbing (Lowside)"] = assetCost.plumbing;
        costs["HVAC (Lowside)"] = assetCost.hvac;
        costs["CCTV, etc."] = inputs.cctv ? 50 : 0;
        
        costs["Transformer Capacity"] = (parseFloat(inputs.transformerCapacity) * 3000) / totalBuiltupArea;
        costs["DG Capacity"] = (parseFloat(inputs.dgCapacity) * 15000) / totalBuiltupArea;
        costs["UPS / Other High Side"] = inputs.ups ? 50 : 0;
        costs["Lift"] = inputs.lift ? 75 : 0;
        costs["HVAC (Highside)"] = inputs.hvacHighside ? 120 : 0;
        costs["STP Capacity"] = (parseFloat(inputs.stpCapacity) * 30) / totalBuiltupArea;
        costs["OHT Capacity"] = (parseFloat(inputs.ohtCapacity) * 20) / totalBuiltupArea;
        costs["UG Sump Capacity"] = (parseFloat(inputs.ugSumpCapacity) * 30) / totalBuiltupArea;
        costs["Motors"] = (parseFloat(inputs.motorsNos) * 120000) / totalBuiltupArea;
        costs["External Drainage System"] = inputs.externalDrainage ? 90 : 40;
        
        // Basement Height Adjustment Logic
        if (numBasements === 2) {
             costs["Basement Height Adjustment"] = (2 * totalBasementHeight) - fullHeight;
        }

        costs["Roads & External Drains"] = inputs.roadsDrains ? 120 : 0;
        costs["Hardscape"] = inputs.hardscape ? 100 : 0;
        costs["Softscape"] = inputs.softscape ? 80 : 0;
        costs["Entrance Arch"] = inputs.entranceArch ? 70 : 0;

        const totalCostPerSqft = Object.values(costs).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
        const subTotal = totalBuiltupArea * totalCostPerSqft;

        setResults({
            totalBuiltupArea: totalBuiltupArea,
            subTotalCost: subTotal,
            grandTotalCost: subTotal * (1 + GST_RATE),
            costSummary: costs
        });

        setDeck(3);
    };


    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Project Cost Range Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                    {deck === 1 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-6">Deck 1: Project Inputs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label htmlFor="assetClass">Asset Class</Label><Select value={inputs.assetClass} onValueChange={(v) => handleSelectChange('assetClass', v)}><SelectTrigger id="assetClass"><SelectValue /></SelectTrigger><SelectContent>{assetClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label htmlFor="plotArea">Plot Area (sqft)</Label><Input type="number" id="plotArea" value={inputs.plotArea} onChange={handleInputChange} placeholder="e.g., 2000" min="0" /></div>
                                <div><Label htmlFor="effectiveArea">Effective Area (sqft)</Label><Input type="number" id="effectiveArea" value={inputs.effectiveArea} disabled /></div>
                                <div><Label htmlFor="numFloors">Number of Floors (G + x + T)</Label><Input type="number" id="numFloors" value={inputs.numFloors} onChange={handleInputChange} placeholder="Enter 'x', e.g., 5" min="0" /></div>
                                <div><Label htmlFor="numBasements">Number of Basements</Label><Input type="number" id="numBasements" value={inputs.numBasements} onChange={handleNumBasementsChange} placeholder="e.g., 1" min="0" /></div>
                                <div><Label htmlFor="fullHeight">Full Height of Building (in ft)</Label><Input type="number" id="fullHeight" value={inputs.fullHeight} onChange={handleInputChange} placeholder="e.g., 60" min="0" /></div>
                            </div>
                             {parseInt(inputs.numBasements, 10) > 0 && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {inputs.basements.map((_, i) => (
                                        <div key={i} className="p-4 border rounded-lg space-y-2">
                                            <h4 className="font-semibold">Basement {i + 1}</h4>
                                            <div><Label htmlFor={`basementArea${i}`}>Area (sqft)</Label><Input type="number" name="area" id={`basementArea${i}`} value={inputs.basements[i].area} onChange={(e) => handleBasementInputChange(i, e)} placeholder="Enter area" /></div>
                                            <div><Label htmlFor={`basementHeight${i}`}>Height (ft)</Label><Input type="number" name="height" id={`basementHeight${i}`} value={inputs.basements[i].height} onChange={(e) => handleBasementInputChange(i, e)} placeholder="Enter height" /></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end mt-6"><Button onClick={() => setDeck(2)}>Next</Button></div>
                        </div>
                    )}
                    {deck === 2 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-6">Deck 2: Detailed Costs</h3>
                            <div className="space-y-6">
                                <div><Label className="font-semibold text-gray-700">Foundation</Label><Select value={inputs.foundationType} onValueChange={(v) => handleSelectChange('foundationType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{foundationTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label className="font-semibold text-gray-700">Facade Works</Label><div className="flex items-center space-x-2 mt-2"><Checkbox id="elevationCost" checked={inputs.elevationCost} onCheckedChange={(c) => handleSelectChange('elevationCost', c as boolean)} /><label htmlFor="elevationCost" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Elevation Cost - Lumpsum Cost Based on Requirement</label></div></div>
                                <div><Label className="font-semibold text-gray-700">Other MEP Lowside Works</Label><div className="flex items-center space-x-2 mt-2"><Checkbox id="cctv" checked={inputs.cctv} onCheckedChange={(c) => handleSelectChange('cctv', c as boolean)} /><label htmlFor="cctv" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">CCTV, Access Control, PA System, FA System, etc.</label></div></div>
                                <div><h4 className="font-semibold text-gray-700">Electrical - Highside Works</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div><Label htmlFor="transformerCapacity">Transformer Capacity (kVa)</Label><Input type="number" id="transformerCapacity" value={inputs.transformerCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div><Label htmlFor="dgCapacity">DG Capacity (kVa)</Label><Input type="number" id="dgCapacity" value={inputs.dgCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="ups" checked={inputs.ups} onCheckedChange={(c) => handleSelectChange('ups', c as boolean)} /><label htmlFor="ups" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">UPS / Other High Side</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="lift" checked={inputs.lift} onCheckedChange={(c) => handleSelectChange('lift', c as boolean)} /><label htmlFor="lift" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Lift</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="hvacHighside" checked={inputs.hvacHighside} onCheckedChange={(c) => handleSelectChange('hvacHighside', c as boolean)} /><label htmlFor="hvacHighside" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">HVAC</label></div>
                                    </div>
                                </div>
                                <div><h4 className="font-semibold text-gray-700">Plumbing</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div><Label htmlFor="stpCapacity">STP - Capacity in Ltrs</Label><Input type="number" id="stpCapacity" value={inputs.stpCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div><Label htmlFor="ohtCapacity">OHT - Capacity in Ltrs</Label><Input type="number" id="ohtCapacity" value={inputs.ohtCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div><Label htmlFor="ugSumpCapacity">UG Sump - Capacity in Ltrs</Label><Input type="number" id="ugSumpCapacity" value={inputs.ugSumpCapacity} onChange={handleInputChange} min="0" /></div>
                                        <div><Label htmlFor="motorsNos">Motors - in Nos.</Label><Input type="number" id="motorsNos" value={inputs.motorsNos} onChange={handleInputChange} min="0" /></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="externalDrainage" checked={inputs.externalDrainage} onCheckedChange={(c) => handleSelectChange('externalDrainage', c as boolean)} /><label htmlFor="externalDrainage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">External Drainage System</label></div>
                                    </div>
                                </div>
                                <div><h4 className="font-semibold text-gray-700">External Development</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div className="flex items-center space-x-2"><Checkbox id="roadsDrains" checked={inputs.roadsDrains} onCheckedChange={(c) => handleSelectChange('roadsDrains', c as boolean)} /><label htmlFor="roadsDrains" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Roads & External Drains</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="hardscape" checked={inputs.hardscape} onCheckedChange={(c) => handleSelectChange('hardscape', c as boolean)} /><label htmlFor="hardscape" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hardscape</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="softscape" checked={inputs.softscape} onCheckedChange={(c) => handleSelectChange('softscape', c as boolean)} /><label htmlFor="softscape" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Softscape</label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="entranceArch" checked={inputs.entranceArch} onCheckedChange={(c) => handleSelectChange('entranceArch', c as boolean)} /><label htmlFor="entranceArch" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Entrance Arch</label></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-6">
                                <Button variant="secondary" onClick={() => setDeck(1)}>Back</Button>
                                <Button onClick={calculateCost}>Calculate</Button>
                            </div>
                        </div>
                    )}
                    {deck === 3 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-6">Deck 3: Final Cost Summary</h3>
                            <div className="mb-4 space-y-2 text-lg">
                                <p><strong>Total Built-up Area:</strong> {results.totalBuiltupArea.toFixed(2)} Sqft</p>
                                <p><strong>Sub Total Cost (without GST):</strong> ₹{results.subTotalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                <p><strong>Grand Total Cost (with GST):</strong> ₹{results.grandTotalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Cost / Sqft</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {Object.entries(results.costSummary).map(([key, value]) => (
                                            <TableRow key={key}>
                                                <TableCell>{key}</TableCell>
                                                <TableCell>₹{value.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button variant="secondary" onClick={() => setDeck(2)}>Back</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
