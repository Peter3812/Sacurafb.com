import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: "fas fa-chart-line", label: "Dashboard" },
    { path: "/content", icon: "fas fa-magic", label: "AI Content" },
    { path: "/scheduler", icon: "fas fa-calendar-alt", label: "Scheduler" },
    { path: "/facebook-pages", icon: "fab fa-facebook", label: "FB Pages" },
    { path: "/facebook-connect", icon: "fas fa-plug", label: "Connect FB" },
    { path: "/messenger-bot", icon: "fas fa-comments", label: "Messenger Bot" },
    { path: "/analytics", icon: "fas fa-chart-bar", label: "Analytics" },
    { path: "/ad-intelligence", icon: "fas fa-bullseye", label: "Ad Intelligence" },
  ];

  const bottomNavItems = [
    { path: "/billing", icon: "fas fa-credit-card", label: "Billing" },
    { path: "/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-card dark:bg-card border-r border-border dark:border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 sidebar-mobile sidebar-compact",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fab fa-facebook-f text-primary-foreground text-sm"></i>
            </div>
            <h1 className="text-xl font-bold text-foreground dark:text-foreground">FBPro.MCP</h1>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
      </div>

      <nav className="px-3 pb-4 lg:px-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <div
              key={item.path}
              onClick={() => {
                setLocation(item.path);
                onClose(); // Close mobile menu on navigation
              }}
              className={cn(
                "nav-item flex items-center space-x-3 px-3 py-4 text-sm font-medium rounded-lg transition-all cursor-pointer touch-manipulation min-h-[48px]",
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-accent-foreground dark:hover:text-accent-foreground"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setLocation(item.path);
                  onClose();
                }
              }}
            >
              <i className={`${item.icon} w-4 h-4`}></i>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border dark:border-border">
          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <div
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  onClose();
                }}
                className={cn(
                  "nav-item flex items-center space-x-3 px-3 py-4 text-sm font-medium rounded-lg transition-all cursor-pointer touch-manipulation min-h-[48px]",
                  location === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-accent-foreground dark:hover:text-accent-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLocation(item.path);
                    onClose();
                  }
                }}
              >
                <i className={`${item.icon} w-4 h-4`}></i>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
