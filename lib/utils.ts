import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utilitaire pour combiner des classes CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
