import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, isPast, startOfDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColorClasses(date: Date | null | undefined): string {
  if (!date) return 'border-muted';

  const today = startOfDay(new Date());
  const dueDate = startOfDay(date);
  
  const daysUntilDue = differenceInDays(dueDate, today);

  if (daysUntilDue < 0) {
    return 'border-destructive bg-destructive/10 text-destructive'; // Overdue
  }
  if (daysUntilDue <= 3) {
    return 'border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'; // Due in 3 days
  }
  return 'border-green-600 bg-green-500/10 text-green-700 dark:text-green-400'; // On time
}
