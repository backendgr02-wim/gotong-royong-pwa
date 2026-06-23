import { cn } from "@/lib/utils";

type Props = {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ label, error, children, className }: Props) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-ink">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
