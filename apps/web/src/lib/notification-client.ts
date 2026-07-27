import type { Notification } from "@supademo/domain";

export interface NotificationClient {
  list(workspaceId: string, unreadOnly?: boolean): Promise<readonly Notification[]>;
  unreadCount(workspaceId: string): Promise<{ readonly unreadCount: number }>;
  markRead(
    workspaceId: string,
    notificationId?: string | null
  ): Promise<{ readonly updatedCount: number }>;
}

export function createNotificationClient(
  fetcher: typeof fetch = globalThis.fetch,
  baseUrl = "/api/v1"
): NotificationClient {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const response = await fetcher(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store"
    });

    if (!response.ok) {
      let message = "Notification operation failed.";
      try {
        const errorData = (await response.json()) as { error?: { message?: string } };
        if (errorData.error?.message) message = errorData.error.message;
      } catch {
        // use default message
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  }

  return {
    async list(workspaceId, unreadOnly = false) {
      const query = unreadOnly ? "?unreadOnly=true" : "";
      return request<readonly Notification[]>(
        `/workspaces/${encodeURIComponent(workspaceId)}/notifications${query}`
      );
    },

    async unreadCount(workspaceId) {
      return request<{ readonly unreadCount: number }>(
        `/workspaces/${encodeURIComponent(workspaceId)}/notifications/unread-count`
      );
    },

    async markRead(workspaceId, notificationId = null) {
      return request<{ readonly updatedCount: number }>(
        `/workspaces/${encodeURIComponent(workspaceId)}/notifications/mark-read`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId })
        }
      );
    }
  };
}
