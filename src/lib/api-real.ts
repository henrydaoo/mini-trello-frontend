import { apiClient } from "./api-client";
import type {
  AuthResponse,
  BoardResponse,
  CommentResponse,
  NotificationResponse,
  TaskCreatePayload,
  TaskListResponse,
  TaskResponse,
  TaskUpdatePayload,
  UserResponse,
} from "./types";

export const authApiReal = {
  login: (username: string, password: string) =>
    apiClient.post<AuthResponse>("/auth/login", { username, password }).then((r) => r.data),
  register: (username: string, email: string, password: string) =>
    apiClient.post<UserResponse>("/auth/register", { username, email, password }).then((r) => r.data),
};

export const boardApiReal = {
  list: () => apiClient.get<BoardResponse[]>("/boards").then((r) => r.data),
  get: (id: number) => apiClient.get<BoardResponse>(`/boards/${id}`).then((r) => r.data),
  create: (name: string, description: string) =>
    apiClient.post<BoardResponse>("/boards", { name, description }).then((r) => r.data),
  update: (id: number, name: string, description: string) =>
    apiClient.put<BoardResponse>(`/boards/${id}`, { name, description }).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/boards/${id}`),
  addMember: (boardId: number, email: string) =>
    apiClient.post<BoardResponse>(`/boards/${boardId}/members`, { email }).then((r) => r.data),
  removeMember: (boardId: number, userId: number) => apiClient.delete(`/boards/${boardId}/members/${userId}`),
};

export const listApiReal = {
  listForBoard: (boardId: number) =>
    apiClient.get<TaskListResponse[]>(`/boards/${boardId}/lists`).then((r) => r.data),
  create: (boardId: number, name: string) =>
    apiClient.post<TaskListResponse>(`/boards/${boardId}/lists`, { name }).then((r) => r.data),
  rename: (listId: number, name: string) =>
    apiClient.put<TaskListResponse>(`/lists/${listId}`, { name }).then((r) => r.data),
  reorder: (listId: number, position: number) =>
    apiClient.patch<TaskListResponse>(`/lists/${listId}/position`, { position }).then((r) => r.data),
  remove: (listId: number) => apiClient.delete(`/lists/${listId}`),
};

export const taskApiReal = {
  listForList: (listId: number) => apiClient.get<TaskResponse[]>(`/lists/${listId}/tasks`).then((r) => r.data),
  create: (listId: number, payload: TaskCreatePayload) =>
    apiClient.post<TaskResponse>(`/lists/${listId}/tasks`, payload).then((r) => r.data),
  get: (taskId: number) => apiClient.get<TaskResponse>(`/tasks/${taskId}`).then((r) => r.data),
  update: (taskId: number, payload: TaskUpdatePayload) =>
    apiClient.put<TaskResponse>(`/tasks/${taskId}`, payload).then((r) => r.data),
  assign: (taskId: number, assigneeId: number | null) =>
    apiClient.patch<TaskResponse>(`/tasks/${taskId}/assignee`, { assigneeId }).then((r) => r.data),
  move: (taskId: number, targetListId: number, position: number) =>
    apiClient.patch<TaskResponse>(`/tasks/${taskId}/move`, { targetListId, position }).then((r) => r.data),
  remove: (taskId: number) => apiClient.delete(`/tasks/${taskId}`),
};

export const commentApiReal = {
  listForTask: (taskId: number) =>
    apiClient.get<CommentResponse[]>(`/tasks/${taskId}/comments`).then((r) => r.data),
  create: (taskId: number, content: string) =>
    apiClient.post<CommentResponse>(`/tasks/${taskId}/comments`, { content }).then((r) => r.data),
  remove: (commentId: number) => apiClient.delete(`/comments/${commentId}`),
};

export const notificationApiReal = {
  list: () => apiClient.get<NotificationResponse[]>("/notifications").then((r) => r.data),
  markAsRead: (id: number) =>
    apiClient.patch<NotificationResponse>(`/notifications/${id}/read`).then((r) => r.data),
};
