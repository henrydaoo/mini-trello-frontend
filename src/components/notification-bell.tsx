"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { notificationApi } from "@/lib/api";
import { extractErrorMessage } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  async function loadNotifications() {
    try {
      const data = await notificationApi.list();
      setNotifications(data);
    } catch (error) {
      // A failed notification fetch shouldn't block the rest of the app —
      // just skip silently and try again next time the bell is opened.
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleClick(notification: NotificationResponse) {
    try {
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.id);
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) loadNotifications();
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-ink-muted">You&apos;re all caught up.</div>
        ) : (
          notifications.slice(0, 8).map((notification, i) => (
            <div key={notification.id}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                className="flex flex-col items-start gap-0.5 whitespace-normal py-2"
                onSelect={() => handleClick(notification)}
              >
                <div className="flex w-full items-center gap-2">
                  {!notification.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-moss-500" />}
                  <span className={notification.isRead ? "text-ink-muted" : "font-medium text-ink"}>
                    {notification.message}
                  </span>
                </div>
                <span className="pl-3.5 text-xs text-ink-faint">{formatRelativeTime(notification.createdAt)}</span>
              </DropdownMenuItem>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
