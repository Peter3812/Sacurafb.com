import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user = {} } = useAuth();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getUserName = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    return "User";
  };

  return (
    <header className="bg-card dark:bg-card border-b border-border dark:border-border px-4 sm:px-6 py-4 mobile-landscape-header">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 text-muted-foreground hover:text-foreground"
            onClick={onMenuClick}
            data-testid="button-mobile-menu"
          >
            <i className="fas fa-bars text-lg"></i>
          </Button>
          
          <div className="hidden sm:block">
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground" data-testid="header-title">
            Dashboard Overview
          </h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Monitor your Facebook management performance
          </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
            data-testid="button-notifications"
          >
            <i className="fas fa-bell text-lg"></i>
          </Button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground dark:text-foreground" data-testid="text-user-name">
                {getUserName((user as any)?.firstName, (user as any)?.lastName)}
              </p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground" data-testid="text-user-plan">
                Pro Plan
              </p>
            </div>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              {(user as any)?.profileImageUrl ? (
                <img 
                  src={(user as any).profileImageUrl} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                  data-testid="image-user-avatar"
                />
              ) : (
                <span className="text-xs font-medium text-primary-foreground" data-testid="text-user-initials">
                  {getInitials((user as any)?.firstName, (user as any)?.lastName)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
