export const TEAM_ROLES = {
  OWNER: 'Owner' as const,
  ADMIN: 'Admin' as const,
  BILLING: 'Billing' as const
} as const;

export type TeamRole = typeof TEAM_ROLES[keyof typeof TEAM_ROLES];