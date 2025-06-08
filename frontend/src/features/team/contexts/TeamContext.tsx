import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useJoinedTeams } from '@/features/team';
import { useAuth } from '@/features/auth';
import { TeamRole, TEAM_ROLES } from '@/constants/teamRoles';

interface ActiveTeam {
  id: string;
  name: string;
  role: TeamRole;
}

interface TeamContextType {
  activeTeam: ActiveTeam | null;
  switchTeam: (teamId: string, teamName: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

interface TeamProviderProps {
  children: ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
  const [activeTeam, setActiveTeam] = useState<ActiveTeam | null>(() => {
    const storedTeamId = localStorage.getItem('activeTeamId');
    const storedTeamName = localStorage.getItem('activeTeamName');
    const storedRole = localStorage.getItem('activeTeamRole');
    
    // Normalize the stored role to match our constants
    let normalizedStoredRole: TeamRole | null = null;
    if (storedRole) {
      if (storedRole.toLowerCase() === 'owner') {
        normalizedStoredRole = TEAM_ROLES.OWNER;
      } else if (storedRole.toLowerCase() === 'admin') {
        normalizedStoredRole = TEAM_ROLES.ADMIN;
      } else if (storedRole.toLowerCase() === 'billing') {
        normalizedStoredRole = TEAM_ROLES.BILLING;
      }
    }
    
    return storedTeamId && storedTeamName && normalizedStoredRole 
      ? { id: storedTeamId, name: storedTeamName, role: normalizedStoredRole } 
      : null;
  });

  const { isAuthenticated, user } = useAuth();
  const { data: joinedTeams, isLoading } = useJoinedTeams();
  
  // Ensure joinedTeams is always an array
  const safeJoinedTeams = Array.isArray(joinedTeams) ? joinedTeams : [];

  // Clear team data when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveTeam(null);
    }
  }, [isAuthenticated]);

  // Initialize team on first load if no active team is set
  useEffect(() => {
    if (isAuthenticated && !activeTeam && !isLoading && safeJoinedTeams.length > 0) {
      const firstTeam = safeJoinedTeams[0];
      switchTeam(firstTeam.id, firstTeam.name);
    }
  }, [isAuthenticated, activeTeam, safeJoinedTeams, isLoading]);

  const switchTeam = (teamId: string, teamName: string) => {
    localStorage.setItem('activeTeamId', teamId);
    localStorage.setItem('activeTeamName', teamName);
    
    // Find the current user's role in the team
    const team = safeJoinedTeams.find(t => t.id === teamId);
    const currentUserMember = team?.members?.find(member => member.email === user?.email);
    const rawRole = currentUserMember?.role || TEAM_ROLES.ADMIN;
    
    // Ensure role matches our constants exactly
    let normalizedRole: TeamRole;
    if (rawRole.toLowerCase() === 'owner') {
      normalizedRole = TEAM_ROLES.OWNER;
    } else if (rawRole.toLowerCase() === 'admin') {
      normalizedRole = TEAM_ROLES.ADMIN;
    } else if (rawRole.toLowerCase() === 'billing') {
      normalizedRole = TEAM_ROLES.BILLING;
    } else {
      normalizedRole = TEAM_ROLES.ADMIN; // Default fallback
    }
    
    console.log('Team switch debug:', {
      teamId,
      teamName,
      userEmail: user?.email,
      rawRole,
      normalizedRole,
      teamMembers: team?.members?.map(m => ({ email: m.email, role: m.role }))
    });
    
    localStorage.setItem('activeTeamRole', normalizedRole);
    setActiveTeam({ id: teamId, name: teamName, role: normalizedRole });
  };

  const value: TeamContextType = {
    activeTeam,
    switchTeam,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}; 