export type Role = "USER" | "ADMIN";
export type NotificationPreference = "EMAIL" | "IN_APP";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  notificationPreference: NotificationPreference;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface BoardMemberResponse {
  userId: number;
  username: string;
  email: string;
}

export interface BoardResponse {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerUsername: string;
  members: BoardMemberResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  id: number;
  boardId: number;
  name: string;
  position: number;
  createdAt: string;
}

export interface TaskResponse {
  id: number;
  listId: number;
  title: string;
  description: string | null;
  assigneeId: number | null;
  assigneeUsername: string | null;
  priority: Priority;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentResponse {
  id: number;
  taskId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
}

export interface NotificationResponse {
  id: number;
  taskId: number;
  taskTitle: string;
  type: NotificationPreference;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}
