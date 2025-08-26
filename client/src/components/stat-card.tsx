import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendPositive?: boolean;
  iconColor?: string;
  iconBg?: string;
  className?: string;
  "data-testid"?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendPositive = true,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  className,
  "data-testid": testId,
}: StatCardProps) {
  return (
    <Card className={cn("border border-border dark:border-border", className)} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground dark:text-foreground" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
            <i className={cn(icon, iconColor, "text-lg")}></i>
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            <span 
              className={cn(
                "text-sm",
                trendPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
              data-testid={`stat-trend-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {trend}
            </span>
            <span className="text-sm text-muted-foreground dark:text-muted-foreground ml-1">
              from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
