import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to display as May 10, 2025
export function formatDate(date: Date): string {
  return format(date, 'MMMM d, yyyy')
}

// Format time to display as 2:30 PM (in Pacific timezone)
export function formatTime(date: Date): string {
  return formatInTimeZone(date, 'America/Los_Angeles', 'h:mm a')
}
