"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useCreateBoard } from "@/hooks/queries/use-boards";
import { extractErrorMessage } from "@/lib/api-client";
import { boardSchema, type BoardInput } from "@/lib/validations";
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

export function CreateBoardDialog() {
  const [open, setOpen] = useState(false);
  const createBoard = useCreateBoard();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardInput>({ resolver: zodResolver(boardSchema) });

  function onSubmit(data: BoardInput) {
    createBoard.mutate(
      { name: data.name, description: data.description ?? "" },
      {
        onSuccess: () => {
          toast.success("Board created");
          setOpen(false);
          reset();
        },
        onError: (error) => toast.error(extractErrorMessage(error)),
      }
    );
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
            <Button type="submit" disabled={createBoard.isPending}>
              {createBoard.isPending ? "Creating…" : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
