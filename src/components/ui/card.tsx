import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-3xl bg-surface p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]", className)}
      {...props}
    />
  );
}
