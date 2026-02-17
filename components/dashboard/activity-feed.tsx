"use client";

import { formatDistanceToNow } from "date-fns";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  iconColor?: string;
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  title: string;
  items: ActivityItem[];
  maxHeight?: string;
}

export function ActivityFeed({ title, items, maxHeight = "320px" }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-start gap-3 py-1.5">
                  <div className="mt-0.5 shrink-0">
                    <Icon className={cn("h-4 w-4", item.iconColor || "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
