import { getDb, save } from "./mock/db";
import type { MockNotification } from "./mock/seed";
import type { NotificationResponse } from "./types";

const delay = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message: string): never {
  // Caught by extractErrorMessage()'s `error instanceof Error` branch, so it surfaces
  // exactly like a real backend error message would.
  throw new Error(message);
}

function toPublicNotification(n: MockNotification): NotificationResponse {
  const { userId: _userId, ...rest } = n;
  return rest;
}

function currentUser() {
  const user = {
    id: 1,
    username: "alice",
    email: "alice@gmail.com",
  };
  if (!user) fail("Not authenticated");
  return user;
}

export const notificationApiMock = {
  async list(): Promise<NotificationResponse[]> {
    await delay();
    const user = currentUser();
    const db = getDb();
    return db.notifications
      .filter((n) => n.userId === user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map(toPublicNotification);
  },

  async markAsRead(id: number): Promise<NotificationResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const notification = db.notifications.find(
      (n) => n.id === id && n.userId === user.id,
    );
    if (!notification) fail("Notification not found");
    notification.isRead = true;
    save(db);
    return toPublicNotification(notification);
  },
};
