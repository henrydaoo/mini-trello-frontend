"use client";

import Link from "next/link";
import { LayoutGrid, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notification-bell";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6">
      <Link href="/boards" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-moss-500 text-white">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <span className="font-display text-lg font-semibold text-ink">Mini Trello</span>
      </Link>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-md p-1 outline-none hover:bg-ink/5">
            <Avatar>
              <AvatarFallback>{user ? initials(user.username) : "?"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium text-ink">{user?.username}</p>
              <p className="text-xs text-ink-muted">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={logout}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
