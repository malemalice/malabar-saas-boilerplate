import apiClient from '@/lib/api-client';

// Types
export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: string;
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
  role: string;
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
class TeamService {
  private readonly baseUrl = '/api/teams';

  async getMyTeam(): Promise<Team> {
    return apiClient.get<Team>(`${this.baseUrl}/my-team`);
  }

  async getJoinedTeams(): Promise<JoinedTeam[]> {
    return apiClient.get<JoinedTeam[]>(`${this.baseUrl}/joined`);
  }

  async getTeamById(teamId: string): Promise<Team> {
    return apiClient.get<Team>(`${this.baseUrl}/${teamId}`);
  }

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    return apiClient.post<Team>(`${this.baseUrl}`, data);
  }

  async inviteMember(teamId: string, data: InviteMemberRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/${teamId}/invite`, data);
  }

  async acceptInvitation(teamId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/invitations/${teamId}/accept`);
  }

  async rejectInvitation(teamId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/invitations/${teamId}/reject`);
  }

  async updateMemberRole(teamId: string, userId: string, data: UpdateMemberRoleRequest): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(`${this.baseUrl}/${teamId}/members/${userId}/role`, data);
  }

  async removeMember(teamId: string, userId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/${teamId}/members/${userId}`);
  }

  async deleteTeam(teamId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/${teamId}`);
  }
}

export default new TeamService(); 