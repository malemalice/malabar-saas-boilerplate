import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import teamService from '../api/team.service';
import type { Team, JoinedTeam, InviteMemberRequest } from '../api/team.service';

// Query Keys
export const teamKeys = {
  all: ['teams'] as const,
  myTeam: () => [...teamKeys.all, 'my-team'] as const,
  joined: () => [...teamKeys.all, 'joined'] as const,
  byId: (id: string) => [...teamKeys.all, 'detail', id] as const,
};

// Get my team
export const useMyTeam = () => {
  return useQuery({
    queryKey: teamKeys.myTeam(),
    queryFn: teamService.getMyTeam,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get joined teams
export const useJoinedTeams = () => {
  return useQuery({
    queryKey: teamKeys.joined(),
    queryFn: teamService.getJoinedTeams,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get team by ID
export const useTeamById = (teamId: string) => {
  return useQuery({
    queryKey: teamKeys.byId(teamId),
    queryFn: () => teamService.getTeamById(teamId),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create team mutation
export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => teamService.createTeam({ name }),
    onSuccess: () => {
      // Invalidate and refetch team queries
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (error) => {
      console.error('Create team failed:', error);
    },
  });
};

// Invite member mutation
export const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, email, role }: { teamId: string; email: string; role?: string }) => 
      teamService.inviteMember(teamId, { email, role }),
    onSuccess: (_, variables) => {
      // Invalidate team data
      queryClient.invalidateQueries({ queryKey: teamKeys.byId(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.myTeam() });
    },
    onError: (error) => {
      console.error('Invite member failed:', error);
    },
  });
};

// Accept invitation mutation
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamService.acceptInvitation(teamId),
    onSuccess: () => {
      // Invalidate team queries
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (error) => {
      console.error('Accept invitation failed:', error);
    },
  });
};

// Reject invitation mutation
export const useRejectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamService.rejectInvitation(teamId),
    onSuccess: () => {
      // Invalidate team queries
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (error) => {
      console.error('Reject invitation failed:', error);
    },
  });
};

// Update member role mutation
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: string; userId: string; role: string }) => 
      teamService.updateMemberRole(teamId, userId, { role }),
    onSuccess: (_, variables) => {
      // Invalidate team data
      queryClient.invalidateQueries({ queryKey: teamKeys.byId(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.myTeam() });
    },
    onError: (error) => {
      console.error('Update member role failed:', error);
    },
  });
};

// Remove member mutation
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => 
      teamService.removeMember(teamId, userId),
    onSuccess: (_, variables) => {
      // Invalidate team data
      queryClient.invalidateQueries({ queryKey: teamKeys.byId(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.myTeam() });
    },
    onError: (error) => {
      console.error('Remove member failed:', error);
    },
  });
};

// Delete team mutation
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: () => {
      // Invalidate all team queries
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (error) => {
      console.error('Delete team failed:', error);
    },
  });
}; 