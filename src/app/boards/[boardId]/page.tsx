"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { useBoardQuery } from "@/hooks/queries/use-board";
import { useCreateList, useListsQuery } from "@/hooks/queries/use-lists";
import { useTasksForLists } from "@/hooks/queries/use-tasks";
import { extractErrorMessage } from "@/lib/api-client";
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

  const boardQuery = useBoardQuery(boardId);
  const listsQuery = useListsQuery(boardId);
  const lists = listsQuery.data ?? [];
  const { tasksByListId } = useTasksForLists(lists.map((l) => l.id));

  const createList = useCreateList(boardId);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  const board = boardQuery.data;

  const members = useMemo(() => {
    if (!board) return [];
    return [{ userId: board.ownerId, username: board.ownerUsername, email: "" }, ...board.members];
  }, [board]);

  const selectedTask = useMemo(() => {
    if (selectedTaskId == null) return null;
    return Object.values(tasksByListId).flat().find((t) => t.id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasksByListId]);

  function handleAddList() {
    const parsed = listSchema.safeParse({ name: newListName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    createList.mutate(newListName.trim(), {
      onSuccess: () => {
        setNewListName("");
        setIsAddingList(false);
      },
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  useEffect(() => {
    if (boardQuery.isError) {
      toast.error(extractErrorMessage(boardQuery.error));
      router.push("/boards");
    }
  }, [boardQuery.isError, boardQuery.error, router]);

  if (boardQuery.isLoading || !board) {
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
          <InviteMemberDialog boardId={boardId} />
        </div>
      </div>

      <div className="scrollbar-thin flex flex-1 gap-4 overflow-x-auto px-4 py-4 sm:px-6">
        {lists.map((list) => (
          <KanbanList
            key={list.id}
            list={list}
            tasks={tasksByListId[list.id] ?? []}
            members={members}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
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
                <Button size="sm" onClick={handleAddList} disabled={createList.isPending}>
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
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
          onDeleted={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
