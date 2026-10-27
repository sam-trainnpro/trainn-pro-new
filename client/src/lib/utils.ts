import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to display as May 10, 2025
export function formatDate(date: Date): string {
  return formatInTimeZone(date, 'America/Los_Angeles', 'MMMM d, yyyy')
}

export function formatCalendarDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "America/Los_Angeles" }).format(new Date(date));
}

// Format time to display as 2:30 PM (in Pacific timezone)
export function formatTime(date: Date): string {
  return formatInTimeZone(date, 'America/Los_Angeles', 'h:mm a')
}
