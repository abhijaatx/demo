"use client";

import type { Notification } from "@supademo/domain";
import * as React from "react";
import { createNotificationClient, type NotificationClient } from "../src/lib/notification-client";

export interface NotificationCenterProps {
  readonly workspaceId: string;
  readonly client?: NotificationClient;
}

export function NotificationCenter({
  workspaceId,
  client: providedClient
}: NotificationCenterProps) {
  const client = React.useMemo(
    () => providedClient ?? createNotificationClient(),
    [providedClient]
  );

  const [isOpen, setIsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<readonly Notification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await client.unreadCount(workspaceId);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore poll error
    }
  }, [client, workspaceId]);

  React.useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, 15_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const loadNotifications = React.useCallback(async () => {
    if (!isOpen || !workspaceId) return;
    setLoading(true);
    try {
      const list = await client.list(workspaceId);
      setNotifications(list);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [client, isOpen, workspaceId]);

  React.useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await client.markRead(workspaceId);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setStatusMessage("All notifications marked as read.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to mark read.");
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await client.markRead(workspaceId, id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to mark read.");
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications center, ${unreadCount} unread`}
        className="relative p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span aria-hidden="true" className="text-lg">
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      {isOpen && (
        <div
          role="region"
          aria-label="Notification list"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden flex flex-col"
        >
          <header className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </header>

          <div className="max-h-96 overflow-y-auto p-2 space-y-2">
            {loading && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Loading notifications...
              </p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                No notifications yet.
              </p>
            )}

            {notifications.map((n) => (
              <article
                key={n.id}
                onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
                className={`p-2.5 rounded-md border text-xs transition-colors cursor-pointer ${
                  n.isRead
                    ? "bg-background border-border/50 opacity-80"
                    : "bg-accent/40 border-primary/40 font-medium"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground truncate">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
