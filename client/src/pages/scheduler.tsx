import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Scheduler() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedPage, setSelectedPage] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pages = [] } = useQuery({
    queryKey: ["/api/facebook-pages"],
  });

  const { data: scheduledContent = [], isLoading } = useQuery({
    queryKey: ["/api/content/scheduled"],
  });

  const { data: allContent = [] } = useQuery({
    queryKey: ["/api/content"],
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/content/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Updated",
        description: "Schedule has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content/scheduled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update schedule.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleContent = (contentId: string, scheduledTime: string) => {
    updateContentMutation.mutate({
      id: contentId,
      updates: {
        status: "scheduled",
        scheduledAt: new Date(scheduledTime).toISOString(),
      },
    });
  };

  const handleUnschedule = (contentId: string) => {
    updateContentMutation.mutate({
      id: contentId,
      updates: {
        status: "draft",
        scheduledAt: null,
      },
    });
  };

  const draftContent = Array.isArray(allContent) ? allContent.filter((content: any) => content.status === 'draft') : [];
  const todayScheduled = Array.isArray(scheduledContent) ? scheduledContent.filter((content: any) => {
    if (!selectedDate) return false;
    const contentDate = new Date(content.scheduledAt);
    return contentDate.toDateString() === selectedDate.toDateString();
  }) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-scheduler">Smart Scheduler</h1>
        <p className="text-muted-foreground">
          Schedule and manage your content publishing across Facebook pages
        </p>
      </div>

      {/* Filters */}
      <Card data-testid="card-filters">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="page-filter">Page</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger data-testid="select-page-filter">
                  <SelectValue placeholder="All pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All pages</SelectItem>
                  {Array.isArray(pages) && pages.map((page: any) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-filter">Time Period</Label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger data-testid="select-time-filter">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="space-x-2">
                <Button size="sm" variant="outline" data-testid="button-optimal-times">
                  <i className="fas fa-chart-line mr-1" />
                  Optimal Times
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-1" data-testid="card-calendar">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              data-testid="calendar-scheduler"
            />
            
            {selectedDate && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground mb-2">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {todayScheduled.length} post{todayScheduled.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Content */}
        <Card className="lg:col-span-2" data-testid="card-scheduled-content">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedDate 
                  ? `Scheduled for ${selectedDate.toLocaleDateString()}`
                  : 'All Scheduled Content'
                }
              </CardTitle>
              <Badge variant="secondary" data-testid="badge-scheduled-count">
                {Array.isArray(scheduledContent) ? scheduledContent.length : 0} scheduled
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : todayScheduled.length > 0 ? (
              <div className="space-y-4">
                {todayScheduled.map((content: any, index: number) => (
                  <div key={content.id} className="border border-border rounded-lg p-4" data-testid={`scheduled-item-${index}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" data-testid={`badge-time-${index}`}>
                          {new Date(content.scheduledAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Badge>
                        <Badge variant="secondary">
                          {content.contentType}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnschedule(content.id)}
                        disabled={updateContentMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-unschedule-${index}`}
                      >
                        <i className="fas fa-times mr-1" />
                        Unschedule
                      </Button>
                    </div>

                    <p className="text-foreground text-sm mb-3 line-clamp-3" data-testid={`text-scheduled-content-${index}`}>
                      {content.content}
                    </p>

                    {content.pageId && (
                      <div className="text-xs text-muted-foreground">
                        Page: {Array.isArray(pages) ? (pages.find((page: any) => page.id === content.pageId)?.name || 'Unknown') : 'Unknown'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : Array.isArray(scheduledContent) && scheduledContent.length > 0 && !selectedDate ? (
              <div className="space-y-4">
                {scheduledContent.map((content: any, index: number) => (
                  <div key={content.id} className="border border-border rounded-lg p-4" data-testid={`all-scheduled-item-${index}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {new Date(content.scheduledAt).toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline">
                          {new Date(content.scheduledAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnschedule(content.id)}
                        disabled={updateContentMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-unschedule-all-${index}`}
                      >
                        <i className="fas fa-times mr-1" />
                        Unschedule
                      </Button>
                    </div>

                    <p className="text-foreground text-sm mb-3 line-clamp-3">
                      {content.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-alt text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No content scheduled</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedDate 
                    ? `No posts scheduled for ${selectedDate.toLocaleDateString()}`
                    : 'Schedule your content to maintain consistent posting across your Facebook pages.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Draft Content to Schedule */}
      {draftContent.length > 0 && (
        <Card data-testid="card-draft-content">
          <CardHeader>
            <CardTitle>Draft Content Available for Scheduling</CardTitle>
            <p className="text-sm text-muted-foreground">
              {draftContent.length} draft post{draftContent.length !== 1 ? 's' : ''} ready to be scheduled
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftContent.map((content: any, index: number) => (
                <div key={content.id} className="border border-border rounded-lg p-4" data-testid={`draft-item-${index}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Draft</Badge>
                      <Badge variant="secondary">{content.contentType}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="text-foreground text-sm mb-4 line-clamp-2" data-testid={`text-draft-content-${index}`}>
                    {content.content}
                  </p>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        type="datetime-local"
                        className="flex-1"
                        data-testid={`input-schedule-time-${index}`}
                        onChange={(e) => {
                          const button = e.target.parentElement?.querySelector('button');
                          if (button) {
                            button.dataset.scheduleTime = e.target.value;
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                          if (input?.value) {
                            handleScheduleContent(content.id, input.value);
                          } else {
                            toast({
                              title: "Time Required",
                              description: "Please select a date and time to schedule the content.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={updateContentMutation.isPending}
                        data-testid={`button-schedule-draft-${index}`}
                      >
                        <i className="fas fa-calendar mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
