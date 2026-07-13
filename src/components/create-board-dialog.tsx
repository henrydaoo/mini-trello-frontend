"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { boardApi } from "@/lib/api";
import { extractErrorMessage } from "@/lib/api-client";
import { boardSchema, type BoardInput } from "@/lib/validations";
import type { BoardResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateBoardDialogProps {
  onCreated: (board: BoardResponse) => void;
}

export function CreateBoardDialog({ onCreated }: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardInput>({ resolver: zodResolver(boardSchema) });

  async function onSubmit(data: BoardInput) {
    setIsSubmitting(true);
    try {
      const board = await boardApi.create(data.name, data.description ?? "");
      onCreated(board);
      toast.success("Board created");
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create board
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Board name</Label>
            <Input id="name" placeholder="e.g. Website Redesign" {...register("name")} />
            {errors.name && <p className="text-xs text-danger-500">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" placeholder="What is this board for?" {...register("description")} />
            {errors.description && <p className="text-xs text-danger-500">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
