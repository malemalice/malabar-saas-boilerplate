import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRemoveMember } from '@/features/team';

interface DeleteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  userId: string;
  email: string;
}

export function DeleteMemberModal({ open, onOpenChange, teamId, userId, email }: DeleteMemberModalProps) {
  const { toast } = useToast();
  const removeMemberMutation = useRemoveMember();

  const handleDelete = () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User ID is required',
        variant: 'destructive',
      });
      return;
    }

    removeMemberMutation.mutate({ teamId, userId }, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Team member removed successfully',
        });
        onOpenChange(false);
      },
      onError: (error: any) => {
        console.error('Error removing member:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to remove team member',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remove Team Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this team member? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm font-medium text-gray-500">{email}</p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={removeMemberMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={removeMemberMutation.isLoading}
          >
            {removeMemberMutation.isLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}