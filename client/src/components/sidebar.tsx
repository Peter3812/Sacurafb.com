import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Sidebar() {
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
    <div className="w-64 bg-card dark:bg-card border-r border-border dark:border-border flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fab fa-facebook-f text-primary-foreground text-sm"></i>
          </div>
          <h1 className="text-xl font-bold text-foreground dark:text-foreground">FBPro.MCP</h1>
        </div>
      </div>

      <nav className="px-4 pb-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <div
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "nav-item flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all cursor-pointer",
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
                onClick={() => setLocation(item.path)}
                className={cn(
                  "nav-item flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all cursor-pointer",
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
