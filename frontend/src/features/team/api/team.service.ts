import apiClient from '@/lib/api-client';

// Types
export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role?: string;
  status: 'Active' | 'Pending' | 'Inactive';
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
}

export interface JoinedTeam {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: TeamMember[];
}

export interface InviteMemberRequest {
  email: string;
  role?: string;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

export interface CreateTeamRequest {
  name: string;
}

// Team Service
const BASE_URL = '/teams';

const teamService = {
  async getMyTeam(): Promise<Team> {
    return apiClient.get<Team>(`${BASE_URL}/my-team`);
  },

  async getJoinedTeams(): Promise<JoinedTeam[]> {
    return apiClient.get<JoinedTeam[]>(`${BASE_URL}/joined`);
  },

  async getTeamById(teamId: string): Promise<Team> {
    return apiClient.get<Team>(`${BASE_URL}/${teamId}`);
  },

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    return apiClient.post<Team>(`${BASE_URL}`, data);
  },

  async inviteMember(teamId: string, data: InviteMemberRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${BASE_URL}/${teamId}/invite`, data);
  },

  async acceptInvitation(teamId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${BASE_URL}/invitations/${teamId}/accept`);
  },

  async rejectInvitation(teamId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${BASE_URL}/invitations/${teamId}/reject`);
  },

  async updateMemberRole(teamId: string, userId: string, data: UpdateMemberRoleRequest): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(`${BASE_URL}/${teamId}/members/${userId}/role`, data);
  },

  async removeMember(teamId: string, userId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${BASE_URL}/${teamId}/members/${userId}`);
  },

  async deleteTeam(teamId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${BASE_URL}/${teamId}`);
  },
};

export default teamService; 