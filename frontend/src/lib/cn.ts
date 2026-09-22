import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names with Tailwind conflict resolution. */
export const cx = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
