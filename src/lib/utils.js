import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn — shadcn-style className combiner (clsx + tailwind-merge)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
