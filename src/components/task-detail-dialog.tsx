"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { useCommentsQuery, useCreateComment, useDeleteComment } from "@/hooks/queries/use-comments";
import { useAssignTask, useDeleteTask, useMoveTask, useUpdateTask } from "@/hooks/queries/use-tasks";
import { extractErrorMessage } from "@/lib/api-client";
import { taskUpdateSchema, commentSchema, type TaskUpdateInput, type CommentInput } from "@/lib/validations";
import type { BoardMemberResponse, TaskListResponse, TaskResponse } from "@/lib/types";
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
  /** Called after a successful delete so the parent can close/clear selection. */
  onDeleted: () => void;
}

export function TaskDetailDialog({
  task,
  lists,
  members,
  tasksByListId,
  open,
  onOpenChange,
  onDeleted,
}: TaskDetailDialogProps) {
  const { user } = useAuth();

  const updateTask = useUpdateTask(task.listId);
  const assignTask = useAssignTask(task.listId);
  const moveTask = useMoveTask();
  const deleteTask = useDeleteTask(task.listId);

  const commentsQuery = useCommentsQuery(task.id, open);
  const comments = commentsQuery.data ?? [];
  const createComment = useCreateComment(task.id);
  const deleteComment = useDeleteComment(task.id);

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

  function toFormValues(t: TaskResponse): TaskUpdateInput {
    return {
      title: t.title,
      description: t.description ?? "",
      priority: t.priority,
      dueDate: t.dueDate ?? "",
    };
  }

  function onSaveDetails(data: TaskUpdateInput) {
    updateTask.mutate(
      {
        taskId: task.id,
        payload: {
          title: data.title,
          description: data.description || undefined,
          priority: data.priority,
          dueDate: data.dueDate || null,
        },
      },
      {
        onSuccess: () => toast.success("Task updated"),
        onError: (error) => toast.error(extractErrorMessage(error)),
      }
    );
  }

  function handleAssigneeChange(value: string) {
    const assigneeId = value === UNASSIGNED ? null : Number(value);
    assignTask.mutate(
      { taskId: task.id, assigneeId },
      {
        onSuccess: () => toast.success(assigneeId ? "Assignee updated — they'll be notified" : "Task unassigned"),
        onError: (error) => toast.error(extractErrorMessage(error)),
      }
    );
  }

  function handleMoveChange(targetListIdStr: string) {
    const targetListId = Number(targetListIdStr);
    if (targetListId === task.listId) return;
    const position = (tasksByListId[targetListId] ?? []).length;
    moveTask.mutate(
      { taskId: task.id, sourceListId: task.listId, targetListId, position },
      {
        onSuccess: () => toast.success("Task moved"),
        onError: (error) => toast.error(extractErrorMessage(error)),
      }
    );
  }

  function handleDelete() {
    if (!window.confirm(`Delete task "${task.title}"? This can't be undone.`)) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => onDeleted(),
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  function onAddComment(data: CommentInput) {
    createComment.mutate(data.content, {
      onSuccess: () => resetComment({ content: "" }),
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  function handleDeleteComment(commentId: number) {
    deleteComment.mutate(commentId, {
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  const isBusy = assignTask.isPending || moveTask.isPending;

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
                <Button type="submit" size="sm" className="self-start" disabled={updateTask.isPending}>
                  {updateTask.isPending ? "Saving…" : "Save changes"}
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
                <Button type="submit" size="icon" disabled={createComment.isPending}>
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
                disabled={isBusy}
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
              <Select value={String(task.listId)} onValueChange={handleMoveChange} disabled={isBusy}>
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
