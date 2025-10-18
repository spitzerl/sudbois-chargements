import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utilitaire pour combiner des classes CSS avec clsx et tailwind-merge
 * Permet d'éviter les conflits de classes lors de la composition
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
