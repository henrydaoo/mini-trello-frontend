"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useInviteMember } from "@/hooks/queries/use-board";
import { extractErrorMessage } from "@/lib/api-client";
import { addMemberSchema, type AddMemberInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InviteMemberDialogProps {
  boardId: number;
}

export function InviteMemberDialog({ boardId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const inviteMember = useInviteMember(boardId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberInput>({ resolver: zodResolver(addMemberSchema) });

  function onSubmit(data: AddMemberInput) {
    inviteMember.mutate(data.email, {
      onSuccess: () => {
        toast.success(`Invited ${data.email}`);
        setOpen(false);
        reset();
      },
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>They&apos;ll get board access right away — no confirmation needed.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" placeholder="teammate@company.com" {...register("email")} />
            {errors.email && <p className="text-xs text-danger-500">{errors.email.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Inviting…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
