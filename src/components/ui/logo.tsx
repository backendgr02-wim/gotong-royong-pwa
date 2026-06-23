import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number;
};

export function Logo({ className, size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-label="Gotong Royong"
    >
      <path
        d="M16 2C12 2 4 6 4 14c0 6 8 14 12 16 4-2 12-10 12-16 0-8-8-12-12-12Z"
        fill="#10b981"
      />
      <path
        d="M16 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
        fill="white"
        opacity={0.9}
      />
      <path
        d="M12 18c2 3 6 3 8 0"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
}
