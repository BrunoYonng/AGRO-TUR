import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

export function Brand({ light = false, className }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 font-black tracking-tight", light ? "text-white" : "text-agro-900", className)}>
      <span className={cn("grid size-9 place-items-center rounded-full", light ? "bg-white/15" : "bg-agro-100")}>
        <Sprout className="size-5" />
      </span>
      <span>AGRO <span className="text-sun">TUR</span></span>
    </Link>
  );
}
