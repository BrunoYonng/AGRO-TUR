import { cn } from "../../lib/utils";

export function Badge({ className, children, tone = "green" }) {
  const tones = {
    green: "bg-agro-100 text-agro-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-700",
    gray: "bg-stone-100 text-stone-700",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}
