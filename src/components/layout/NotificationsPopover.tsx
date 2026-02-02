import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function NotificationsPopover() {
    const { data: notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleNotificationClick = (notification: any) => {
        if (!notification.is_read) {
            markAsRead.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground animate-in zoom-in">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold leading-none">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => markAllAsRead.mutate()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications?.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={cn(
                                        "w-full text-left p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.is_read && "bg-muted/20"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !notification.is_read && "font-semibold")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
