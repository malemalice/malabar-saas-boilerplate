import { cn } from "@/lib/utils";

export interface BadgeProps {
  status: "active" | "inviting" | "reject";
  children: React.ReactNode;
  className?: string;
}

const statusStyles = {
  active: "bg-green-100 text-green-800",
  inviting: "bg-yellow-100 text-yellow-800",
  reject: "bg-red-100 text-red-800",
};

export function Badge({ status, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  );
}