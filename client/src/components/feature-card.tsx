import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  buttonColor?: string;
  iconColor?: string;
  iconBg?: string;
  className?: string;
  "data-testid"?: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  buttonText,
  buttonHref,
  buttonColor = "bg-primary hover:bg-primary/90",
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  className,
  "data-testid": testId,
}: FeatureCardProps) {
  return (
    <Card className={cn("feature-card border border-border dark:border-border", className)} data-testid={testId}>
      <CardContent className="p-6">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", iconBg)}>
          <i className={cn(icon, iconColor, "text-xl")}></i>
        </div>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
          {description}
        </p>
        <Link href={buttonHref}>
          <Button 
            className={cn("w-full text-white transition-colors", buttonColor)}
            data-testid={`button-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {buttonText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
