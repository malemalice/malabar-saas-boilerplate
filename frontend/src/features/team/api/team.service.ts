import axios from '@/lib/axios';

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
    const response = await axios.get(`${BASE_URL}/my-team`);
    return response.data;
  },

  async getJoinedTeams(): Promise<JoinedTeam[]> {
    const response = await axios.get(`${BASE_URL}/joined`);
    return response.data;
  },

  async getTeamById(teamId: string): Promise<Team> {
    const response = await axios.get(`${BASE_URL}/${teamId}`);
    return response.data;
  },

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await axios.post(`${BASE_URL}`, data);
    return response.data;
  },

  async inviteMember(teamId: string, data: InviteMemberRequest): Promise<{ message: string }> {
    const response = await axios.post(`${BASE_URL}/${teamId}/invite`, data);
    return response.data;
  },

  async acceptInvitation(teamId: string): Promise<{ message: string }> {
    const response = await axios.post(`${BASE_URL}/invitations/${teamId}/accept`);
    return response.data;
  },

  async rejectInvitation(teamId: string): Promise<{ message: string }> {
    const response = await axios.post(`${BASE_URL}/invitations/${teamId}/reject`);
    return response.data;
  },

  async updateMemberRole(teamId: string, userId: string, data: UpdateMemberRoleRequest): Promise<{ message: string }> {
    const response = await axios.patch(`${BASE_URL}/${teamId}/members/${userId}/role`, data);
    return response.data;
  },

  async removeMember(teamId: string, userId: string): Promise<{ message: string }> {
    const response = await axios.delete(`${BASE_URL}/${teamId}/members/${userId}`);
    return response.data;
  },

  async deleteTeam(teamId: string): Promise<{ message: string }> {
    const response = await axios.delete(`${BASE_URL}/${teamId}`);
    return response.data;
  },
};

export default teamService; 