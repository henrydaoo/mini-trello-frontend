"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { commentApi, taskApi } from "@/lib/api";
import { extractErrorMessage } from "@/lib/api-client";
import { taskUpdateSchema, commentSchema, type TaskUpdateInput, type CommentInput } from "@/lib/validations";
import type { BoardMemberResponse, CommentResponse, TaskListResponse, TaskResponse } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { formatRelativeTime, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UNASSIGNED = "__unassigned__";

interface TaskDetailDialogProps {
  task: TaskResponse;
  lists: TaskListResponse[];
  members: BoardMemberResponse[];
  tasksByListId: Record<number, TaskResponse[]>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (task: TaskResponse) => void;
  onDeleted: (taskId: number, listId: number) => void;
  onMoved: (task: TaskResponse, fromListId: number) => void;
}

export function TaskDetailDialog({
  task,
  lists,
  members,
  tasksByListId,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
  onMoved,
}: TaskDetailDialogProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<TaskUpdateInput>({
    resolver: zodResolver(taskUpdateSchema),
    defaultValues: toFormValues(task),
  });

  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    reset: resetComment,
  } = useForm<CommentInput>({ resolver: zodResolver(commentSchema) });

  useEffect(() => {
    reset(toFormValues(task));
  }, [task, reset]);

  useEffect(() => {
    if (!open) return;
    commentApi
      .listForTask(task.id)
      .then(setComments)
      .catch((error) => toast.error(extractErrorMessage(error)));
  }, [open, task.id]);

  function toFormValues(t: TaskResponse): TaskUpdateInput {
    return {
      title: t.title,
      description: t.description ?? "",
      priority: t.priority,
      dueDate: t.dueDate ?? "",
    };
  }

  async function onSaveDetails(data: TaskUpdateInput) {
    setIsSavingDetails(true);
    try {
      const updated = await taskApi.update(task.id, {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        dueDate: data.dueDate || null,
      });
      onUpdated(updated);
      toast.success("Task updated");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleAssigneeChange(value: string) {
    setIsAssigning(true);
    try {
      const assigneeId = value === UNASSIGNED ? null : Number(value);
      const updated = await taskApi.assign(task.id, assigneeId);
      onUpdated(updated);
      toast.success(assigneeId ? "Assignee updated — they'll be notified" : "Task unassigned");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleMoveChange(targetListIdStr: string) {
    const targetListId = Number(targetListIdStr);
    if (targetListId === task.listId) return;
    setIsMoving(true);
    try {
      const position = (tasksByListId[targetListId] ?? []).length;
      const updated = await taskApi.move(task.id, targetListId, position);
      onMoved(updated, task.listId);
      toast.success("Task moved");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsMoving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete task "${task.title}"? This can't be undone.`)) return;
    try {
      await taskApi.remove(task.id);
      onDeleted(task.id, task.listId);
      onOpenChange(false);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function onAddComment(data: CommentInput) {
    setIsCommenting(true);
    try {
      const comment = await commentApi.create(task.id, data.content);
      setComments((prev) => [...prev, comment]);
      resetComment({ content: "" });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsCommenting(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      await commentApi.remove(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Task details</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto pr-1 sm:grid-cols-[1fr_180px]">
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSaveDetails)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Input {...register("title")} className="h-auto border-none px-0 font-display text-lg font-semibold shadow-none focus-visible:ring-0" />
                {errors.title && <p className="text-xs text-danger-500">{errors.title.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} {...register("description")} />
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

              {isDirty && (
                <Button type="submit" size="sm" className="self-start" disabled={isSavingDetails}>
                  {isSavingDetails ? "Saving…" : "Save changes"}
                </Button>
              )}
            </form>

            <Separator />

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-ink">Comments</h3>
              <div className="flex max-h-48 flex-col gap-3 overflow-y-auto">
                {comments.length === 0 && <p className="text-sm text-ink-muted">No comments yet.</p>}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px]">{initials(comment.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{comment.username}</span>
                        <span className="text-xs text-ink-faint">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-ink-muted">{comment.content}</p>
                    </div>
                    {user?.id === comment.userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-ink-faint hover:text-danger-500"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleCommentSubmit(onAddComment)} className="flex items-start gap-2">
                <Textarea placeholder="Write a comment…" rows={1} {...registerComment("content")} />
                <Button type="submit" size="icon" disabled={isCommenting}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            <div className="flex flex-col gap-1.5">
              <Label>Assignee</Label>
              <Select
                value={task.assigneeId ? String(task.assigneeId) : UNASSIGNED}
                onValueChange={handleAssigneeChange}
                disabled={isAssigning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={String(m.userId)}>
                      {m.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>List</Label>
              <Select value={String(task.listId)} onValueChange={handleMoveChange} disabled={isMoving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="destructive" size="sm" className="mt-auto" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
