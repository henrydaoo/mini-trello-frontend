"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { TaskResponse } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const priorityStripe: Record<TaskResponse["priority"], string> = {
  LOW: "border-l-moss-500",
  MEDIUM: "border-l-clay-500",
  HIGH: "border-l-danger-500",
};

interface TaskCardProps {
  task: TaskResponse;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-2 rounded-md border border-l-4 border-border bg-white p-3 text-left shadow-card transition-shadow hover:shadow-pop",
        priorityStripe[task.priority]
      )}
    >
      <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
        {task.assigneeUsername && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[9px]">{initials(task.assigneeUsername)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </button>
  );
}
