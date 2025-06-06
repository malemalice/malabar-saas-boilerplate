// Team Feature Exports
export { default as teamService } from './api/team.service';

// Team Types
export type {
  Team,
  TeamMember,
  JoinedTeam,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  CreateTeamRequest,
} from './api/team.service';

// Team Hooks
export {
  useMyTeam,
  useJoinedTeams,
  useTeamById,
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
export { TeamProvider, useTeam } from '../../contexts/team/TeamContext'; 