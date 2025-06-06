import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TEAM_ROLES } from '@/constants/teamRoles';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateMemberRole } from '@/features/team';
import { useTeam } from '@/contexts/team/TeamContext';

interface RoleChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  userId: string;
  email: string;
  currentRole: string;
}

export function RoleChangeModal({ open, onOpenChange, teamId, userId, email, currentRole }: RoleChangeModalProps) {
  const [role, setRole] = useState(currentRole);
  const { toast } = useToast();
  const updateMemberRoleMutation = useUpdateMemberRole();

  const handleSubmit = () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User ID is required',
        variant: 'destructive',
      });
      return;
    }

    updateMemberRoleMutation.mutate({ teamId, userId, role }, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Member role updated successfully',
        });
        onOpenChange(false);
      },
      onError: (error: any) => {
        console.error('Error updating role:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update member role',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Change role for team member
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{email}</p>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={updateMemberRoleMutation.isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TEAM_ROLES.ADMIN}>Admin</SelectItem>
                <SelectItem value={TEAM_ROLES.BILLING}>Billing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMemberRoleMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMemberRoleMutation.isLoading || role === currentRole}
          >
            {updateMemberRoleMutation.isLoading ? 'Changing...' : 'Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}