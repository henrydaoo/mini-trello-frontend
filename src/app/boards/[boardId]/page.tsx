"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { boardApi, listApi, taskApi } from "@/lib/api";
import { extractErrorMessage } from "@/lib/api-client";
import type { BoardResponse, TaskListResponse, TaskResponse } from "@/lib/types";
import { listSchema } from "@/lib/validations";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { KanbanList } from "@/components/kanban-list";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { initials } from "@/lib/utils";

export default function BoardDetailPage() {
  const params = useParams<{ boardId: string }>();
  const boardId = Number(params.boardId);
  const router = useRouter();

  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [lists, setLists] = useState<TaskListResponse[]>([]);
  const [tasksByListId, setTasksByListId] = useState<Record<number, TaskResponse[]>>({});
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const members = useMemo(() => {
    if (!board) return [];
    return [{ userId: board.ownerId, username: board.ownerUsername, email: "" }, ...board.members];
  }, [board]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [boardData, listData] = await Promise.all([boardApi.get(boardId), listApi.listForBoard(boardId)]);
        if (cancelled) return;
        setBoard(boardData);
        setLists(listData.sort((a, b) => a.position - b.position));

        const taskLists = await Promise.all(listData.map((l) => taskApi.listForList(l.id)));
        if (cancelled) return;
        const map: Record<number, TaskResponse[]> = {};
        listData.forEach((l, i) => {
          map[l.id] = taskLists[i].sort((a, b) => a.position - b.position);
        });
        setTasksByListId(map);
      } catch (error) {
        toast.error(extractErrorMessage(error));
        router.push("/boards");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [boardId, router]);

  async function handleAddList() {
    const parsed = listSchema.safeParse({ name: newListName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      const list = await listApi.create(boardId, newListName.trim());
      setLists((prev) => [...prev, list]);
      setTasksByListId((prev) => ({ ...prev, [list.id]: [] }));
      setNewListName("");
      setIsAddingList(false);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  function handleTaskCreated(listId: number, task: TaskResponse) {
    setTasksByListId((prev) => ({ ...prev, [listId]: [...(prev[listId] ?? []), task] }));
  }

  function handleTaskUpdated(updated: TaskResponse) {
    setTasksByListId((prev) => ({
      ...prev,
      [updated.listId]: (prev[updated.listId] ?? []).map((t) => (t.id === updated.id ? updated : t)),
    }));
    setSelectedTask(updated);
  }

  function handleTaskMoved(updated: TaskResponse, fromListId: number) {
    setTasksByListId((prev) => ({
      ...prev,
      [fromListId]: (prev[fromListId] ?? []).filter((t) => t.id !== updated.id),
      [updated.listId]: [...(prev[updated.listId] ?? []), updated],
    }));
    setSelectedTask(updated);
  }

  function handleTaskDeleted(taskId: number, listId: number) {
    setTasksByListId((prev) => ({ ...prev, [listId]: (prev[listId] ?? []).filter((t) => t.id !== taskId) }));
  }

  function handleListRenamed(updated: TaskListResponse) {
    setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  function handleListDeleted(listId: number) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setTasksByListId((prev) => {
      const { [listId]: _removed, ...rest } = prev;
      return rest;
    });
  }

  if (isLoading || !board) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-ink-muted">Loading board…</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/boards")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-lg font-semibold text-ink">{board.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.map((m) => (
              <Avatar key={m.userId} className="border-2 border-white">
                <AvatarFallback>{initials(m.username)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <InviteMemberDialog boardId={boardId} onInvited={setBoard} />
        </div>
      </div>

      <div className="scrollbar-thin flex flex-1 gap-4 overflow-x-auto px-4 py-4 sm:px-6">
        {lists.map((list) => (
          <KanbanList
            key={list.id}
            list={list}
            tasks={tasksByListId[list.id] ?? []}
            members={members}
            onTaskClick={setSelectedTask}
            onTaskCreated={(task) => handleTaskCreated(list.id, task)}
            onListRenamed={handleListRenamed}
            onListDeleted={handleListDeleted}
          />
        ))}

        <div className="w-72 shrink-0">
          {isAddingList ? (
            <div className="flex flex-col gap-2 rounded-lg bg-ink/[0.03] p-2">
              <Input
                autoFocus
                placeholder="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddList()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddList}>
                  Add list
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingList(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" className="w-full justify-start text-ink-muted" onClick={() => setIsAddingList(true)}>
              <Plus className="h-4 w-4" />
              Add list
            </Button>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          lists={lists}
          members={members}
          tasksByListId={tasksByListId}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={(taskId, listId) => {
            handleTaskDeleted(taskId, listId);
            setSelectedTask(null);
          }}
          onMoved={handleTaskMoved}
        />
      )}
    </div>
  );
}
