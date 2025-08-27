import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export default function ResponsiveTable({ 
  children, 
  className, 
  "data-testid": testId 
}: ResponsiveTableProps) {
  return (
    <div 
      className={cn(
        "table-responsive overflow-x-auto border border-border rounded-lg bg-card",
        className
      )}
      data-testid={testId}
    >
      <div className="min-w-[600px]">
        {children}
      </div>
    </div>
  );
}