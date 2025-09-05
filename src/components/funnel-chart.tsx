
'use client';

import { cn } from "@/lib/utils";
import type { Task } from "@/types";

type JourneyFilter = Task | 'All' | 'QuotedGMV' | 'FinalGMV';

interface FunnelChartProps {
  data: {
    stage: Task;
    count: number;
  }[];
  activeFilter: JourneyFilter;
  onFilterChange: (filter: JourneyFilter) => void;
}

export function FunnelChart({ data, activeFilter, onFilterChange }: FunnelChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground">No data available</div>;
  }
  
  const maxCount = Math.max(...data.map(item => item.count), 0);
  const colors = ['bg-sky-500', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500'];

  return (
    <div className="w-full space-y-2 font-sans">
        {data.map((item, index) => {
            const widthPercentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const colorClass = colors[index % colors.length];

            return (
                <div 
                    key={item.stage}
                    className={cn(
                        "flex items-center gap-4 transition-opacity duration-300 cursor-pointer",
                        activeFilter !== 'All' && activeFilter !== item.stage && 'opacity-30 hover:opacity-100'
                    )}
                    onClick={() => onFilterChange(item.stage)}
                >
                    <div className="w-1/3 text-right text-sm text-muted-foreground truncate">{item.stage}</div>
                    <div className="w-2/3">
                         <div
                            style={{ width: `${widthPercentage}%`, marginLeft: 'auto', marginRight: 'auto' }}
                            className={cn(
                                "text-white font-bold text-sm text-center rounded-sm py-2 transition-all duration-300",
                                colorClass
                            )}
                         >
                            {item.count}
                        </div>
                    </div>
                </div>
            )
        })}
    </div>
  );
}

    