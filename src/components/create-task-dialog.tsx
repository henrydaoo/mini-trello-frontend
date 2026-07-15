"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useCreateTask } from "@/hooks/queries/use-tasks";
import { extractErrorMessage } from "@/lib/api-client";
import { taskCreateSchema, type TaskCreateInput } from "@/lib/validations";
import type { BoardMemberResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateTaskDialogProps {
  listId: number;
  members: BoardMemberResponse[];
}

export function CreateTaskDialog({ listId, members }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask(listId);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: { priority: "MEDIUM", assigneeId: "" },
  });

  function onSubmit(data: TaskCreateInput) {
    createTask.mutate(
      {
        title: data.title,
        description: data.description || undefined,
        assigneeId: data.assigneeId ? Number(data.assigneeId) : null,
        priority: data.priority,
        dueDate: data.dueDate || null,
      },
      {
        onSuccess: () => {
          toast.success("Task added");
          setOpen(false);
          reset({ priority: "MEDIUM", assigneeId: "", title: "", description: "", dueDate: "" });
        },
        onError: (error) => toast.error(extractErrorMessage(error)),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-ink-muted hover:text-ink">
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Fix login redirect bug" {...register("title")} />
            {errors.title && <p className="text-xs text-danger-500">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Optional details" {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Assignee</Label>
            <Controller
              control={control}
              name="assigneeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={String(m.userId)}>
                        {m.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Adding…" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
