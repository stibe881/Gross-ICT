import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export function NotificationBell() {
  const [, setLocation] = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread mentions
  const { data: mentions = [] } = trpc.mention.getUnreadMentions.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark mention as read mutation
  const markAsReadMutation = trpc.mention.markAsRead.useMutation({
    onSuccess: () => {
      // Refetch mentions after marking as read
      window.location.reload();
    },
  });

  useEffect(() => {
    setUnreadCount(mentions.length);
  }, [mentions]);

  const handleNotificationClick = (ticketId: number, mentionId: number) => {
    // Mark as read
    markAsReadMutation.mutate({ mentionId });
    
    // Navigate to ticket
    setLocation(`/admin?ticket=${ticketId}`);
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Gerade eben';
    if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)}h`;
    return `vor ${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-white/10"
        >
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 text-black text-xs font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-gray-900 border-white/10">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="font-semibold text-white">Benachrichtigungen</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-400">{unreadCount} ungelesene</p>
          )}
        </div>

        {mentions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            Keine neuen Benachrichtigungen
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {mentions.map((mention) => (
              <DropdownMenuItem
                key={mention.id}
                className="px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 border-b border-white/5"
                onClick={() => handleNotificationClick(mention.ticketId, mention.id)}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">
                      {mention.mentionedByName} hat Sie erwähnt
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(mention.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Ticket #{mention.ticketId}: {mention.ticketSubject}
                  </p>
                  {mention.commentText && (
                    <p className="text-xs text-gray-300 line-clamp-2 mt-1">
                      {mention.commentText}
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {mentions.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <div className="px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-yellow-400 hover:text-yellow-300 hover:bg-white/5"
                onClick={() => {
                  mentions.forEach((mention) => {
                    markAsReadMutation.mutate({ mentionId: mention.id });
                  });
                }}
              >
                Alle als gelesen markieren
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
