"use client";

import { LayoutGrid } from "lucide-react";
import { useBoardsQuery } from "@/hooks/queries/use-boards";
import { BoardCard } from "@/components/board-card";
import { CreateBoardDialog } from "@/components/create-board-dialog";

export default function BoardsPage() {
  const { data: boards, isLoading } = useBoardsQuery();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Your boards</h1>
          <p className="text-sm text-ink-muted">Everything you own or have been invited to.</p>
        </div>
        <CreateBoardDialog />
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading boards…</p>
      ) : !boards || boards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-moss-100 text-moss-600">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-ink">No boards yet</p>
            <p className="text-sm text-ink-muted">Create your first board to start organizing tasks.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}
    </div>
  );
}
