import type {
  BoardResponse,
  CommentResponse,
  NotificationResponse,
  TaskListResponse,
  TaskResponse,
} from "@/lib/types";

export interface MockUser {
  id: number;
  username: string;
  email: string;
  password: string; // plaintext — this is a client-only mock, never a real auth store
  role: "USER" | "ADMIN";
  notificationPreference: "EMAIL" | "IN_APP";
}

// The real GET /api/notifications is already scoped to the caller (derived from the
// JWT), so NotificationResponse has no userId field. The mock has no JWT to derive
// that from, so it keeps userId internally and strips it before returning data —
// see mock-api.ts's `toPublicNotification`.
export interface MockNotification extends NotificationResponse {
  userId: number;
}

export interface MockDb {
  users: MockUser[];
  boards: BoardResponse[];
  lists: TaskListResponse[];
  tasks: TaskResponse[];
  comments: CommentResponse[];
  notifications: MockNotification[];
  nextId: Record<"user" | "board" | "list" | "task" | "comment" | "notification", number>;
}

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3_600_000).toISOString();
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString().slice(0, 10);

export function buildSeedDb(): MockDb {
  const users: MockUser[] = [
    { id: 1, username: "alice", email: "alice@example.com", password: "password123", role: "USER", notificationPreference: "IN_APP" },
    { id: 2, username: "bob", email: "bob@example.com", password: "password123", role: "USER", notificationPreference: "EMAIL" },
    { id: 3, username: "carol", email: "carol@example.com", password: "password123", role: "USER", notificationPreference: "IN_APP" },
  ];

  const boards: BoardResponse[] = [
    {
      id: 1,
      name: "Product Launch",
      description: "Coordinate the Q3 launch across design, engineering, and marketing.",
      ownerId: 1,
      ownerUsername: "alice",
      members: [
        { userId: 2, username: "bob", email: "bob@example.com" },
        { userId: 3, username: "carol", email: "carol@example.com" },
      ],
      createdAt: daysAgo(9),
      updatedAt: daysAgo(1),
    },
    {
      id: 2,
      name: "Personal Tasks",
      description: "Everything that isn't work.",
      ownerId: 1,
      ownerUsername: "alice",
      members: [],
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
  ];

  const lists: TaskListResponse[] = [
    { id: 1, boardId: 1, name: "To Do", position: 0, createdAt: daysAgo(9) },
    { id: 2, boardId: 1, name: "In Progress", position: 1, createdAt: daysAgo(9) },
    { id: 3, boardId: 1, name: "Done", position: 2, createdAt: daysAgo(9) },
    { id: 4, boardId: 2, name: "To Do", position: 0, createdAt: daysAgo(20) },
    { id: 5, boardId: 2, name: "Done", position: 1, createdAt: daysAgo(20) },
  ];

  const tasks: TaskResponse[] = [
    {
      id: 1, listId: 1, title: "Design landing page hero",
      description: "Explore 2-3 directions for the hero section, focus on the headline + CTA.",
      assigneeId: 3, assigneeUsername: "carol", priority: "HIGH", dueDate: daysFromNow(2),
      position: 0, createdAt: daysAgo(6), updatedAt: daysAgo(1),
    },
    {
      id: 2, listId: 1, title: "Write launch announcement blog post",
      description: null, assigneeId: null, assigneeUsername: null, priority: "MEDIUM", dueDate: daysFromNow(5),
      position: 1, createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
    {
      id: 3, listId: 2, title: "Set up analytics tracking",
      description: "Events for signup, checkout, and the new pricing page.",
      assigneeId: 2, assigneeUsername: "bob", priority: "MEDIUM", dueDate: daysFromNow(3),
      position: 0, createdAt: daysAgo(4), updatedAt: hoursAgo(20),
    },
    {
      id: 4, listId: 3, title: "Finalize pricing page copy",
      description: null, assigneeId: 1, assigneeUsername: "alice", priority: "LOW", dueDate: null,
      position: 0, createdAt: daysAgo(8), updatedAt: hoursAgo(2),
    },
    {
      id: 5, listId: 4, title: "Renew passport",
      description: null, assigneeId: null, assigneeUsername: null, priority: "MEDIUM", dueDate: daysFromNow(30),
      position: 0, createdAt: daysAgo(15), updatedAt: daysAgo(15),
    },
    {
      id: 6, listId: 5, title: "Book dentist appointment",
      description: null, assigneeId: 1, assigneeUsername: "alice", priority: "LOW", dueDate: null,
      position: 0, createdAt: daysAgo(18), updatedAt: daysAgo(10),
    },
  ];

  const comments: CommentResponse[] = [
    { id: 1, taskId: 1, userId: 2, username: "bob", content: "Love the direction — can we make the CTA a bit bigger?", createdAt: hoursAgo(20) },
    { id: 2, taskId: 1, userId: 3, username: "carol", content: "Good call, updating now.", createdAt: hoursAgo(19) },
  ];

  const notifications: MockNotification[] = [
    { id: 1, userId: 1, taskId: 4, taskTitle: "Finalize pricing page copy", type: "IN_APP", message: 'You were assigned to "Finalize pricing page copy"', isRead: false, createdAt: hoursAgo(2) },
    { id: 2, userId: 2, taskId: 3, taskTitle: "Set up analytics tracking", type: "EMAIL", message: 'You were assigned to "Set up analytics tracking"', isRead: true, createdAt: daysAgo(4) },
    { id: 3, userId: 3, taskId: 1, taskTitle: "Design landing page hero", type: "IN_APP", message: 'You were assigned to "Design landing page hero"', isRead: false, createdAt: daysAgo(6) },
  ];

  return {
    users,
    boards,
    lists,
    tasks,
    comments,
    notifications,
    nextId: { user: 4, board: 3, list: 6, task: 7, comment: 3, notification: 4 },
  };
}
