import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Ticket, 
  Receipt, 
  UserCircle, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { toast } from "sonner";

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function ActivityFeed({ limit = 10, showHeader = true, className = "" }: ActivityFeedProps) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(true);
  const utils = trpc.useUtils();
  const { socket, connected } = useWebSocket();

  const { data, isLoading, refetch } = trpc.activities.list.useQuery({
    page,
    pageSize: limit,
  });

  const { data: stats } = trpc.activities.stats.useQuery();

  // WebSocket real-time updates for activities
  useEffect(() => {
    if (!socket || !connected) return;

    const handleActivityCreated = () => {
      utils.activities.list.invalidate();
      utils.activities.stats.invalidate();
    };

    socket.on("activity:created", handleActivityCreated);

    return () => {
      socket.off("activity:created", handleActivityCreated);
    };
  }, [socket, connected, utils]);

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "ticket_created":
      case "ticket_updated":
        return <Ticket className="h-4 w-4" />;
      case "invoice_created":
      case "invoice_updated":
        return <Receipt className="h-4 w-4" />;
      case "customer_created":
        return <UserCircle className="h-4 w-4" />;
      case "reminder_sent":
        return <Bell className="h-4 w-4" />;
      case "ticket_resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "ticket_created":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "ticket_updated":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "invoice_created":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "customer_created":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "reminder_sent":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "ticket_resolved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? "en" : ""}`;
    return activityDate.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: diffDays > 365 ? "numeric" : undefined,
    });
  };

  return (
    <Card className={`bg-white/5 border-white/10 ${className}`}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Aktivitäts-Feed</CardTitle>
              {stats && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    Heute: {stats.today}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    Woche: {stats.week}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="h-8 px-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-8 px-2"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      
      {expanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : data && data.activities.length > 0 ? (
            <div className="space-y-3">
              {data.activities.map((activity: any, index: number) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.activityType)}`}>
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{activity.userName}</span>
                          <span className="text-xs text-gray-600">•</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(activity.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {data.total > limit && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    Mehr laden ({data.total - data.activities.length} weitere)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Aktivitäten gefunden</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
