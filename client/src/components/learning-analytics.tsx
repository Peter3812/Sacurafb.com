import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, MessageSquare, BarChart3, Clock, Star, Target, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface LearningAnalyticsProps {
  pageId: string;
}

interface LearningInsight {
  totalConversations: number;
  avgResponseTime: number;
  avgSatisfaction: number;
  commonIntents: Array<{ intent: string; count: number }>;
  sentimentDistribution: { [key: string]: number };
  learningRecommendations: string;
}

interface BotPerformance {
  totalConversations: number;
  successfulResponses: number;
  learningScore: number;
  learningEnabled: boolean;
}

export function LearningAnalytics({ pageId }: LearningAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: [`/api/messenger-bot/${pageId}/learning-analytics`],
    enabled: !!pageId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  const insights: LearningInsight | null = analytics?.insights;
  const performance: BotPerformance = analytics?.botPerformance || {
    totalConversations: 0,
    successfulResponses: 0,
    learningScore: 0,
    learningEnabled: false
  };

  return (
    <div className="space-y-4">
      {/* Learning Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span className="text-sm font-medium">AI Learning</span>
        </div>
        <Badge variant={performance.learningEnabled ? "default" : "secondary"}>
          {performance.learningEnabled ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {performance.totalConversations}
          </div>
          <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
            Total Conversations
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {performance.learningScore}%
          </div>
          <div className="text-xs text-green-600/70 dark:text-green-400/70">
            Learning Score
          </div>
        </div>
      </div>

      {/* Learning Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Learning Progress</span>
          <span>{performance.learningScore}%</span>
        </div>
        <Progress value={performance.learningScore} className="h-2" />
      </div>

      {insights && (
        <>
          <Separator />

          {/* Response Performance */}
          {insights.avgResponseTime && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Avg Response Time</span>
              </div>
              <Badge variant="outline">
                {(insights.avgResponseTime / 1000).toFixed(1)}s
              </Badge>
            </div>
          )}

          {/* User Satisfaction */}
          {insights.avgSatisfaction && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Satisfaction</span>
              </div>
              <Badge variant="outline">
                {insights.avgSatisfaction.toFixed(1)}/5
              </Badge>
            </div>
          )}

          {/* Common Intents */}
          {insights.commonIntents && insights.commonIntents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Top Conversation Topics</span>
              </div>
              <div className="space-y-1">
                {insights.commonIntents.slice(0, 3).map((intent, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{intent.intent}</span>
                    <Badge variant="secondary" className="text-xs">
                      {intent.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment Distribution */}
          {insights.sentimentDistribution && Object.keys(insights.sentimentDistribution).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Sentiment Analysis</span>
              </div>
              <div className="space-y-1">
                {Object.entries(insights.sentimentDistribution).map(([sentiment, count]) => (
                  <div key={sentiment} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{sentiment}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            sentiment === 'positive' ? 'bg-green-500' :
                            sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ 
                            width: `${(count / insights.totalConversations) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Recommendations */}
          {insights.learningRecommendations && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">AI Recommendations</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                {insights.learningRecommendations}
              </p>
            </div>
          )}
        </>
      )}

      {!insights && performance.totalConversations === 0 && (
        <div className="text-center py-4 text-gray-500">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Start conversations to see learning analytics</p>
        </div>
      )}
    </div>
  );
}