import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function FirstLetterUpper(text: String){
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}