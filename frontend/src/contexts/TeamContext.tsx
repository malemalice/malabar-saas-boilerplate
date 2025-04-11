import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '@/lib/axios';

interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Billing';
  status: 'Active' | 'Pending' | 'Inactive';
}

interface TeamContextType {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  activeTeam: { id: string; name: string; role: 'Owner' | 'Admin' | 'Billing' } | null;
  fetchMembers: () => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  switchTeam: (teamId: string, teamName: string) => void;
  updateMemberRole: (userId: string, role: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<{ id: string; name: string; role: 'Owner' | 'Admin' | 'Billing' } | null>(() => {
    const storedTeamId = localStorage.getItem('activeTeamId');
    const storedTeamName = localStorage.getItem('activeTeamName');
    const storedRole = localStorage.getItem('activeTeamRole');
    return storedTeamId && storedTeamName && storedRole ? { id: storedTeamId, name: storedTeamName, role: storedRole as 'Owner' | 'Admin' | 'Billing' } : null;
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: userData } = await axios.get('/api/auth/me');
      const response = await axios.get('/api/teams/'+activeTeam?.id);
      const teamData = response.data;
      
      // Transform the API response to match our TeamMember interface
      const transformedMembers = teamData.members.map((member: any) => {
        let role = member.role;
        if (member.userId === teamData.ownerId) {
          role = 'Owner';
        }
        
        return {
          userId: member.userId,
          name: member.name,
          email: member.email,
          role: role,
          status: member.status
        };
      });
      
      setMembers(transformedMembers);
      
      // Find current user's role in the team
      const currentUserMember = transformedMembers.find((member: TeamMember) => member.email === userData.email);
      if (currentUserMember && activeTeam) {
        const newActiveTeam = { ...activeTeam, role: currentUserMember.role };
        console.log(currentUserMember)
        setActiveTeam(newActiveTeam);
        localStorage.setItem('activeTeamRole', currentUserMember.role);
      }
    } catch (err) {
      setError('Failed to fetch team members');
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeTeam = async () => {
      if (!activeTeam) {
        try {
          const { data: teams } = await axios.get('/api/teams/joined');
          if (teams.length > 0) {
            localStorage.setItem('activeTeamId', teams[0].id);
            localStorage.setItem('activeTeamName', teams[0].name);
            setActiveTeam({ id: teams[0].id, name: teams[0].name, role: teams[0].role });
          }
        } catch (err) {
          console.error('Failed to fetch teams:', err);
          setError('Failed to initialize team');
        }
      }
      if (activeTeam?.id) {
        await fetchMembers();
      }
    };
    
    initializeTeam();
  }, [activeTeam?.id]);

  const inviteMember = async (email: string, role: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/teams/my-team');
      const teamId = response.data.id;
      await axios.post(`/api/teams/${teamId}/invite`, { email });
      await fetchMembers();
    } catch (err) {
      setError('Failed to invite team member');
      console.error('Error inviting team member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchTeam = (teamId: string, teamName: string) => {
    localStorage.setItem('activeTeamId', teamId);
    localStorage.setItem('activeTeamName', teamName);
    const storedRole = localStorage.getItem('activeTeamRole');
    setActiveTeam({ id: teamId, name: teamName, role: storedRole as 'Owner' | 'Admin' | 'Billing' });
    fetchMembers();
  };

  const updateMemberRole = async (userId: string, role: string) => {
    if (!activeTeam) return;
    try {
      setLoading(true);
      setError(null);
      await axios.patch(`/api/teams/${activeTeam.id}/members/${userId}/role`, { role });
      await fetchMembers();
    } catch (err) {
      setError('Failed to update member role');
      console.error('Error updating member role:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!activeTeam) return;
    try {
      setLoading(true);
      setError(null);
      await axios.delete(`/api/teams/${activeTeam.id}/members/${userId}`);
      await fetchMembers();
    } catch (err) {
      setError('Failed to remove team member');
      console.error('Error removing team member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    members,
    loading,
    error,
    activeTeam,
    fetchMembers,
    inviteMember,
    switchTeam,
    updateMemberRole,
    removeMember
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}