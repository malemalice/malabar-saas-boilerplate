// Team Feature Exports
export { default as teamService } from './api/team.service';

// Team Types
export type {
  Team,
  TeamMember,
  JoinedTeam,
  CreateTeamRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from './api/team.service';

// Team Hooks
export {
  useMyTeam,
  useJoinedTeams,
  useCreateTeam,
  useInviteMember,
  useAcceptInvitation,
  useRejectInvitation,
  useUpdateMemberRole,
  useRemoveMember,
  useDeleteTeam,
  teamKeys,
} from './hooks/useTeam';

// Team Context
export { TeamProvider, useTeam } from './contexts/TeamContext';

// Team Pages
export { default as TeamPage } from './pages/Team'; 