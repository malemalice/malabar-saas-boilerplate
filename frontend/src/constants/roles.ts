export const TEAM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  BILLING: 'billing',
} as const;

export type TeamRole = typeof TEAM_ROLES[keyof typeof TEAM_ROLES];