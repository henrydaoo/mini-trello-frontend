"use client";

import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { BoardResponse } from "@/lib/types";
import { useDeleteBoard } from "@/hooks/queries/use-boards";
import { extractErrorMessage } from "@/lib/api-client";
import { initials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface BoardCardProps {
  board: BoardResponse;
}

export function BoardCard({ board }: BoardCardProps) {
  const deleteBoard = useDeleteBoard();
  const allMembers = [{ userId: board.ownerId, username: board.ownerUsername, email: "" }, ...board.members];

  function handleDelete() {
    if (!window.confirm(`Delete "${board.name}"? This can't be undone.`)) return;
    deleteBoard.mutate(board.id, {
      onSuccess: () => toast.success("Board deleted"),
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  return (
    <Card className="group relative flex flex-col transition-shadow hover:shadow-pop">
      <Link href={`/boards/${board.id}`} className="flex flex-1 flex-col">
        <CardHeader>
          <CardTitle className="pr-6">{board.name}</CardTitle>
          <CardDescription className="line-clamp-2 min-h-[2.5em]">
            {board.description || "No description yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex items-center">
          <div className="flex -space-x-2">
            {allMembers.slice(0, 4).map((m) => (
              <Avatar key={m.userId} className="border-2 border-white">
                <AvatarFallback>{initials(m.username)}</AvatarFallback>
              </Avatar>
            ))}
            {allMembers.length > 4 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-paper text-[11px] font-medium text-ink-muted">
                +{allMembers.length - 4}
              </span>
            )}
          </div>
        </CardContent>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem destructive onSelect={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
