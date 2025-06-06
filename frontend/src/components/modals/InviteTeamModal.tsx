import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TEAM_ROLES } from '@/constants/teamRoles';
import { useInviteMember } from '@/features/team';
import { useTeam } from '@/contexts/team/TeamContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const inviteFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum([TEAM_ROLES.OWNER, TEAM_ROLES.ADMIN, TEAM_ROLES.BILLING]),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export function InviteTeamModal() {
  const [open, setOpen] = useState(false);
  const { activeTeam } = useTeam();
  const inviteMemberMutation = useInviteMember();
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      role: TEAM_ROLES.ADMIN,
    },
  });

  const onSubmit = (data: InviteFormValues) => {
    if (!activeTeam?.id) {
      form.setError('email', { message: 'No active team selected' });
      return;
    }

    inviteMemberMutation.mutate({
      teamId: activeTeam.id,
      email: data.email,
      role: data.role.toLowerCase()
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        form.setError('email', { 
          message: error.response?.data?.message || 'Failed to invite team member. Please try again.' 
        });
        console.error('Failed to invite team member:', error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-blue-500 border-blue-500">
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team</DialogTitle>
          <DialogDescription>
            Add people to your team by email
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value={TEAM_ROLES.OWNER}>Owner</option>
                      <option value={TEAM_ROLES.ADMIN}>Admin</option>
                      <option value={TEAM_ROLES.BILLING}>Billing</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={inviteMemberMutation.isLoading}>
                {inviteMemberMutation.isLoading ? 'Inviting...' : 'Invite'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}