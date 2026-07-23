import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", size = "default", ...props }) {
  const variants = {
    primary: "bg-agro-500 text-white hover:bg-agro-600 focus-visible:ring-agro-500",
    yellow: "bg-sun text-ink hover:bg-yellow-300 focus-visible:ring-sun",
    outline: "border border-black/15 bg-white/5 hover:bg-black/5 focus-visible:ring-agro-500",
    ghost: "hover:bg-black/5 focus-visible:ring-agro-500",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500",
  };
  const sizes = {
    default: "h-11 px-5",
    sm: "h-9 px-3 text-sm",
    icon: "size-11",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
