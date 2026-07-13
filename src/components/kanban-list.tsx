"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { listApi } from "@/lib/api";
import { extractErrorMessage } from "@/lib/api-client";
import type { BoardMemberResponse, TaskListResponse, TaskResponse } from "@/lib/types";
import { TaskCard } from "@/components/task-card";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanListProps {
  list: TaskListResponse;
  tasks: TaskResponse[];
  members: BoardMemberResponse[];
  onTaskClick: (task: TaskResponse) => void;
  onTaskCreated: (task: TaskResponse) => void;
  onListRenamed: (list: TaskListResponse) => void;
  onListDeleted: (listId: number) => void;
}

export function KanbanList({
  list,
  tasks,
  members,
  onTaskClick,
  onTaskCreated,
  onListRenamed,
  onListDeleted,
}: KanbanListProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(list.name);

  async function saveRename() {
    setIsRenaming(false);
    if (!name.trim() || name === list.name) {
      setName(list.name);
      return;
    }
    try {
      const updated = await listApi.rename(list.id, name.trim());
      onListRenamed(updated);
    } catch (error) {
      toast.error(extractErrorMessage(error));
      setName(list.name);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete list "${list.name}" and all its tasks?`)) return;
    try {
      await listApi.remove(list.id);
      onListDeleted(list.id);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-ink/[0.03] p-2">
      <div className="mb-1 flex items-center justify-between px-1.5 py-1">
        {isRenaming ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            className="h-7"
          />
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">{list.name}</h2>
            <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
              {tasks.length}
            </span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setIsRenaming(true)}>
              <Pencil className="h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="scrollbar-thin flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-y-auto px-1 pb-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>

      <div className="mt-1 px-1">
        <CreateTaskDialog listId={list.id} members={members} onCreated={onTaskCreated} />
      </div>
    </div>
  );
}
