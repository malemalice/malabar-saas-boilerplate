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
import { useTeam } from '@/contexts/TeamContext';

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { updateMemberRole } = useTeam();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      if (!userId) {
        throw new Error('User ID is required');
      }
      await updateMemberRole(userId, role);
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update member role',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
              disabled={isLoading}
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
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || role === currentRole}
          >
            Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}