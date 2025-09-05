
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  calculateAreScore,
  areInputSchema,
  areCities,
  areZoning,
  arePlotAreas,
  areRoadWidths,
  nearbyAssetTypes50m,
  nearbyAssetTypes2km,
  areWillingnessToManage,
  type AreInput,
  type AreResult,
} from '@/lib/are-logic';
import { Badge } from './ui/badge';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { MultiSelect, type OptionType } from './ui/multi-select';


const nearbyAssetTypes50mOptions: OptionType[] = nearbyAssetTypes50m.map(a => ({
    value: a,
    label: a === 'MRU' ? 'MRU (Multi Residential Unit)' : a,
}));

const nearbyAssetTypes2kmOptions: OptionType[] = nearbyAssetTypes2km.map(a => ({
    value: a,
    label: a,
}));


export function AreForm() {
  const [result, setResult] = useState<AreResult | null>(null);

  const form = useForm<AreInput>({
    resolver: zodResolver(areInputSchema),
    defaultValues: {
        city: '',
        zoning: '',
        plotArea: '',
        roadWidth: '',
        assetType50m: [],
        assetType2km: [],
        willingnessToManage: '',
    },
  });

  const handleFormSubmit = (values: AreInput) => {
    const calculatedResult = calculateAreScore(values);
    setResult(calculatedResult);
  };

  const handleReset = () => {
    form.reset();
    setResult(null);
  };
  
  const handleBack = () => {
    setResult(null);
  }

  if (result) {
    const topRecommendation = result.rankedAssets.find(a => a.isFeasible);
    const alternatives = result.rankedAssets.filter(a => a.isFeasible && a.assetType !== topRecommendation?.assetType).slice(0, 2);

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Asset Recommendation Results</CardTitle>
            <CardDescription>Based on your inputs, here is the top recommended asset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {topRecommendation ? (
              <div className="space-y-6">
                <Card className="bg-green-500/10 border-green-500">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Award className="w-10 h-10 text-green-700" />
                            <div>
                                <CardDescription className="font-semibold text-green-800">Top Recommended Asset</CardDescription>
                                <CardTitle className="text-3xl text-green-900">{topRecommendation.assetType}</CardTitle>
                            </div>
                            <Badge variant="outline" className="ml-auto text-lg bg-white">
                                {topRecommendation.totalScore}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Permissible</AlertTitle>
                            <AlertDescription>{topRecommendation.remarks}</AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {alternatives.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Alternatives</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {alternatives.map(alt => (
                                <Card key={alt.assetType}>
                                    <CardHeader>
                                        <div className='flex items-center justify-between'>
                                          <CardTitle>{alt.assetType}</CardTitle>
                                          <Badge variant="secondary">{alt.totalScore}</Badge>
                                        </div>
                                    </CardHeader>
                                     <CardContent>
                                        <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4"/>{alt.remarks}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <details>
                    <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">Show Score Breakdown</summary>
                    <div className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Score Breakdown for {topRecommendation.assetType}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Factor</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.breakdown[topRecommendation.assetType]?.map(item => (
                                            <TableRow key={item.factor}>
                                                <TableCell className="font-medium">{item.factor}</TableCell>
                                                <TableCell>{item.score}</TableCell>
                                                <TableCell>{item.remarks}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </details>
              </div>
            ) : (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Whoops!</AlertTitle>
                    <AlertDescription>
                       We don't have any prediction for you.
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={handleReset} variant="outline" className="w-full">Start Over</Button>
                <Button onClick={handleBack} variant="secondary" className="w-full">Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center h-full'>
        <Card className="max-w-2xl w-full">
            <CardHeader>
            <CardTitle>Asset Recommendation Engine</CardTitle>
            <CardDescription>Fill in the details below to get a recommendation for the best asset type.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger></FormControl><SelectContent>{areCities.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="zoning" render={({ field }) => (<FormItem><FormLabel>Zoning</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select zoning" /></SelectTrigger></FormControl><SelectContent>{areZoning.map(z=><SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="plotArea" render={({ field }) => (<FormItem><FormLabel>Plot Area (sq ft)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select plot area" /></SelectTrigger></FormControl><SelectContent>{arePlotAreas.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="roadWidth" render={({ field }) => (<FormItem><FormLabel>Road Width (ft)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select road width" /></SelectTrigger></FormControl><SelectContent>{areRoadWidths.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField
                            control={form.control}
                            name="assetType50m"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Asset Type within 50m</FormLabel>
                                <MultiSelect
                                    selected={field.value}
                                    options={nearbyAssetTypes50mOptions}
                                    onChange={field.onChange}
                                    placeholder="Select asset types..."
                                />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="assetType2km"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Asset Type within 2km</FormLabel>
                                <MultiSelect
                                    selected={field.value}
                                    options={nearbyAssetTypes2kmOptions}
                                    onChange={field.onChange}
                                    placeholder="Select asset types..."
                                />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="willingnessToManage" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Willingness to Manage</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select willingness level" /></SelectTrigger></FormControl><SelectContent>{areWillingnessToManage.map(w=><SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    <Button type="submit" className="w-full">Calculate Recommendation</Button>
                </form>
            </Form>
            </CardContent>
        </Card>
    </div>
  );
}
