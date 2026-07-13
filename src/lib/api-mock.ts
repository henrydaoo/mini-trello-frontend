import { getDb, nextId, save } from "./mock/db";
import type { MockNotification } from "./mock/seed";
import { getStoredUser } from "./storage";
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

const delay = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message: string): never {
  // Caught by extractErrorMessage()'s `error instanceof Error` branch, so it surfaces
  // exactly like a real backend error message would.
  throw new Error(message);
}

function toPublicUser(u: { id: number; username: string; email: string; role: "USER" | "ADMIN"; notificationPreference: "EMAIL" | "IN_APP" }): UserResponse {
  return { id: u.id, username: u.username, email: u.email, role: u.role, notificationPreference: u.notificationPreference };
}

function toPublicNotification(n: MockNotification): NotificationResponse {
  const { userId: _userId, ...rest } = n;
  return rest;
}

function currentUser() {
  const user = getStoredUser();
  if (!user) fail("Not authenticated");
  return user;
}

function hasBoardAccess(board: BoardResponse, userId: number): boolean {
  return board.ownerId === userId || board.members.some((m) => m.userId === userId);
}

function requireBoardAccess(board: BoardResponse | undefined, userId: number): BoardResponse {
  if (!board) fail("Board not found");
  if (!hasBoardAccess(board, userId)) fail("You don't have access to this board");
  return board;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApiMock = {
  async login(username: string, password: string): Promise<AuthResponse> {
    await delay();
    const db = getDb();
    const match = db.users.find(
      (u) => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && u.password === password
    );
    if (!match) fail("Invalid username or password");
    return { token: `mock-token-${match.id}`, user: toPublicUser(match) };
  },

  async register(username: string, email: string, password: string): Promise<UserResponse> {
    await delay();
    const db = getDb();
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) fail("Username is already taken");
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) fail("Email is already registered");
    const user = {
      id: nextId(db, "user"),
      username,
      email,
      password,
      role: "USER" as const,
      notificationPreference: "IN_APP" as const,
    };
    db.users.push(user);
    save(db);
    return toPublicUser(user);
  },
};

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

export const boardApiMock = {
  async list(): Promise<BoardResponse[]> {
    await delay();
    const user = currentUser();
    const db = getDb();
    return db.boards.filter((b) => hasBoardAccess(b, user.id));
  },

  async get(id: number): Promise<BoardResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    return requireBoardAccess(db.boards.find((b) => b.id === id), user.id);
  },

  async create(name: string, description: string): Promise<BoardResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const now = new Date().toISOString();
    const board: BoardResponse = {
      id: nextId(db, "board"),
      name,
      description: description || null,
      ownerId: user.id,
      ownerUsername: user.username,
      members: [],
      createdAt: now,
      updatedAt: now,
    };
    db.boards.unshift(board);
    save(db);
    return board;
  },

  async update(id: number, name: string, description: string): Promise<BoardResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const board = db.boards.find((b) => b.id === id);
    if (!board) fail("Board not found");
    if (board.ownerId !== user.id) fail("Only the board owner can update this board");
    board.name = name;
    board.description = description || null;
    board.updatedAt = new Date().toISOString();
    save(db);
    return board;
  },

  async remove(id: number): Promise<void> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const board = db.boards.find((b) => b.id === id);
    if (!board) fail("Board not found");
    if (board.ownerId !== user.id) fail("Only the board owner can delete this board");

    const listIds = db.lists.filter((l) => l.boardId === id).map((l) => l.id);
    const taskIds = db.tasks.filter((t) => listIds.includes(t.listId)).map((t) => t.id);

    db.boards = db.boards.filter((b) => b.id !== id);
    db.lists = db.lists.filter((l) => l.boardId !== id);
    db.tasks = db.tasks.filter((t) => !listIds.includes(t.listId));
    db.comments = db.comments.filter((c) => !taskIds.includes(c.taskId));
    db.notifications = db.notifications.filter((n) => !taskIds.includes(n.taskId));
    save(db);
  },

  async addMember(boardId: number, email: string): Promise<BoardResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const board = db.boards.find((b) => b.id === boardId);
    if (!board) fail("Board not found");
    if (board.ownerId !== user.id) fail("Only the board owner can invite members");

    const target = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!target) fail("No user found with that email");
    if (board.ownerId === target.id) fail("This user already owns the board");
    if (board.members.some((m) => m.userId === target.id)) fail("User is already a member of this board");

    board.members.push({ userId: target.id, username: target.username, email: target.email });
    board.updatedAt = new Date().toISOString();
    save(db);
    return board;
  },

  async removeMember(boardId: number, userId: number): Promise<void> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const board = db.boards.find((b) => b.id === boardId);
    if (!board) fail("Board not found");
    if (board.ownerId !== user.id) fail("Only the board owner can remove members");
    board.members = board.members.filter((m) => m.userId !== userId);
    save(db);
  },
};

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

export const listApiMock = {
  async listForBoard(boardId: number): Promise<TaskListResponse[]> {
    await delay();
    const user = currentUser();
    const db = getDb();
    requireBoardAccess(db.boards.find((b) => b.id === boardId), user.id);
    return db.lists.filter((l) => l.boardId === boardId).sort((a, b) => a.position - b.position);
  },

  async create(boardId: number, name: string): Promise<TaskListResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    requireBoardAccess(db.boards.find((b) => b.id === boardId), user.id);
    const position = db.lists.filter((l) => l.boardId === boardId).length;
    const list: TaskListResponse = { id: nextId(db, "list"), boardId, name, position, createdAt: new Date().toISOString() };
    db.lists.push(list);
    save(db);
    return list;
  },

  async rename(listId: number, name: string): Promise<TaskListResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const list = db.lists.find((l) => l.id === listId);
    if (!list) fail("List not found");
    requireBoardAccess(db.boards.find((b) => b.id === list.boardId), user.id);
    list.name = name;
    save(db);
    return list;
  },

  async reorder(listId: number, position: number): Promise<TaskListResponse> {
    await delay();
    const db = getDb();
    const list = db.lists.find((l) => l.id === listId);
    if (!list) fail("List not found");
    list.position = position;
    save(db);
    return list;
  },

  async remove(listId: number): Promise<void> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const list = db.lists.find((l) => l.id === listId);
    if (!list) fail("List not found");
    const board = db.boards.find((b) => b.id === list.boardId);
    if (!board) fail("Board not found");
    if (board.ownerId !== user.id) fail("Only the board owner can delete a list");

    const taskIds = db.tasks.filter((t) => t.listId === listId).map((t) => t.id);
    db.lists = db.lists.filter((l) => l.id !== listId);
    db.tasks = db.tasks.filter((t) => t.listId !== listId);
    db.comments = db.comments.filter((c) => !taskIds.includes(c.taskId));
    db.notifications = db.notifications.filter((n) => !taskIds.includes(n.taskId));
    save(db);
  },
};

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export const taskApiMock = {
  async listForList(listId: number): Promise<TaskResponse[]> {
    await delay();
    const db = getDb();
    return db.tasks.filter((t) => t.listId === listId).sort((a, b) => a.position - b.position);
  },

  async create(listId: number, payload: TaskCreatePayload): Promise<TaskResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const list = db.lists.find((l) => l.id === listId);
    if (!list) fail("List not found");
    const board = requireBoardAccess(db.boards.find((b) => b.id === list.boardId), user.id);

    let assignee: { id: number; username: string } | null = null;
    if (payload.assigneeId) {
      const candidate = db.users.find((u) => u.id === payload.assigneeId);
      if (!candidate || !hasBoardAccess(board, candidate.id)) fail("Assignee must be a board member");
      assignee = candidate;
    }

    const now = new Date().toISOString();
    const position = db.tasks.filter((t) => t.listId === listId).length;
    const task: TaskResponse = {
      id: nextId(db, "task"),
      listId,
      title: payload.title,
      description: payload.description || null,
      assigneeId: assignee?.id ?? null,
      assigneeUsername: assignee?.username ?? null,
      priority: payload.priority,
      dueDate: payload.dueDate || null,
      position,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.push(task);
    if (assignee) notifyAssignment(db, task, assignee.id);
    save(db);
    return task;
  },

  async get(taskId: number): Promise<TaskResponse> {
    await delay();
    const db = getDb();
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) fail("Task not found");
    return task;
  },

  async update(taskId: number, payload: TaskUpdatePayload): Promise<TaskResponse> {
    await delay();
    const db = getDb();
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) fail("Task not found");
    task.title = payload.title;
    task.description = payload.description || null;
    task.priority = payload.priority;
    task.dueDate = payload.dueDate || null;
    task.updatedAt = new Date().toISOString();
    save(db);
    return task;
  },

  /**
   * Mirrors the backend's TaskAssignedEvent flow: the assignment itself always
   * succeeds first, and notifying the new assignee is a secondary effect that runs
   * after — see notifyAssignment() below. Kept as two separate steps here (rather than
   * inlined) for the same reason the backend keeps them in two classes: assigning a
   * task and notifying about it are different concerns.
   */
  async assign(taskId: number, assigneeId: number | null): Promise<TaskResponse> {
    await delay();
    const db = getDb();
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) fail("Task not found");
    const list = db.lists.find((l) => l.id === task.listId);
    const board = list ? db.boards.find((b) => b.id === list.boardId) : undefined;

    if (assigneeId == null) {
      task.assigneeId = null;
      task.assigneeUsername = null;
    } else {
      const assignee = db.users.find((u) => u.id === assigneeId);
      if (!assignee || !board || !hasBoardAccess(board, assignee.id)) fail("Assignee must be a board member");
      task.assigneeId = assignee.id;
      task.assigneeUsername = assignee.username;
      notifyAssignment(db, task, assignee.id);
    }
    task.updatedAt = new Date().toISOString();
    save(db);
    return task;
  },

  async move(taskId: number, targetListId: number, position: number): Promise<TaskResponse> {
    await delay();
    const db = getDb();
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) fail("Task not found");
    const currentList = db.lists.find((l) => l.id === task.listId);
    const targetList = db.lists.find((l) => l.id === targetListId);
    if (!targetList) fail("Target list not found");
    if (currentList && currentList.boardId !== targetList.boardId) fail("Cannot move a task to a different board");
    task.listId = targetListId;
    task.position = position;
    task.updatedAt = new Date().toISOString();
    save(db);
    return task;
  },

  async remove(taskId: number): Promise<void> {
    await delay();
    const db = getDb();
    db.tasks = db.tasks.filter((t) => t.id !== taskId);
    db.comments = db.comments.filter((c) => c.taskId !== taskId);
    db.notifications = db.notifications.filter((n) => n.taskId !== taskId);
    save(db);
  },
};

function notifyAssignment(db: ReturnType<typeof getDb>, task: TaskResponse, assigneeId: number) {
  const assignee = db.users.find((u) => u.id === assigneeId);
  if (!assignee) return;
  const notification: MockNotification = {
    id: nextId(db, "notification"),
    userId: assignee.id,
    taskId: task.id,
    taskTitle: task.title,
    type: assignee.notificationPreference,
    message: `You were assigned to "${task.title}"`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(notification);
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const commentApiMock = {
  async listForTask(taskId: number): Promise<CommentResponse[]> {
    await delay();
    const db = getDb();
    return db.comments.filter((c) => c.taskId === taskId);
  },

  async create(taskId: number, content: string): Promise<CommentResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const comment: CommentResponse = {
      id: nextId(db, "comment"),
      taskId,
      userId: user.id,
      username: user.username,
      content,
      createdAt: new Date().toISOString(),
    };
    db.comments.push(comment);
    save(db);
    return comment;
  },

  async remove(commentId: number): Promise<void> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const comment = db.comments.find((c) => c.id === commentId);
    if (!comment) fail("Comment not found");
    if (comment.userId !== user.id) fail("You can only delete your own comments");
    db.comments = db.comments.filter((c) => c.id !== commentId);
    save(db);
  },
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationApiMock = {
  async list(): Promise<NotificationResponse[]> {
    await delay();
    const user = currentUser();
    const db = getDb();
    return db.notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(toPublicNotification);
  },

  async markAsRead(id: number): Promise<NotificationResponse> {
    await delay();
    const user = currentUser();
    const db = getDb();
    const notification = db.notifications.find((n) => n.id === id && n.userId === user.id);
    if (!notification) fail("Notification not found");
    notification.isRead = true;
    save(db);
    return toPublicNotification(notification);
  },
};
