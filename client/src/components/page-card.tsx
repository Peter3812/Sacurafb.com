import { Badge } from "@/components/ui/badge";

interface PageCardProps {
  name: string;
  followers: number;
  imageUrl?: string;
  postsThisWeek: number;
  engagementChange: string;
  className?: string;
  "data-testid"?: string;
}

export default function PageCard({
  name,
  followers,
  imageUrl,
  postsThisWeek,
  engagementChange,
  className,
  "data-testid": testId,
}: PageCardProps) {
  const isPositiveChange = !engagementChange.startsWith('-');

  return (
    <div 
      className={`border border-border dark:border-border rounded-lg p-4 bg-card dark:bg-card ${className}`}
      data-testid={testId}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted dark:bg-muted flex items-center justify-center">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`${name} avatar`} 
              className="w-full h-full object-cover"
              data-testid="image-page-avatar"
            />
          ) : (
            <i className="fab fa-facebook text-primary"></i>
          )}
        </div>
        <div>
          <p className="font-medium text-foreground dark:text-foreground text-sm" data-testid="text-page-name">
            {name}
          </p>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground" data-testid="text-page-followers">
            {followers.toLocaleString()} followers
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground dark:text-muted-foreground">Posts this week</span>
          <span className="font-medium text-foreground dark:text-foreground" data-testid="text-posts-week">
            {postsThisWeek}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground dark:text-muted-foreground">Engagement</span>
          <span 
            className={`font-medium ${
              isPositiveChange 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            }`}
            data-testid="text-engagement-change"
          >
            {isPositiveChange ? '+' : ''}{engagementChange}%
          </span>
        </div>
      </div>
    </div>
  );
}
