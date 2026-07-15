export const queryKeys = {
  boards: {
    all: ["boards"] as const,
    detail: (boardId: number) => ["boards", boardId] as const,
  },
  lists: {
    byBoard: (boardId: number) => ["lists", "board", boardId] as const,
  },
  tasks: {
    byList: (listId: number) => ["tasks", "list", listId] as const,
  },
  comments: {
    byTask: (taskId: number) => ["comments", "task", taskId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
};
