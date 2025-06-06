import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useJoinedTeams } from '@/features/team';
import { useAuth } from '@/features/auth';
import { TeamRole, TEAM_ROLES } from '@/constants/teamRoles';
import { FirstLetterUpper } from '@/lib/utils';

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
    
    return storedTeamId && storedTeamName && storedRole 
      ? { id: storedTeamId, name: storedTeamName, role: storedRole as TeamRole } 
      : null;
  });

  const { isAuthenticated } = useAuth();
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
    
    // Find the role from joined teams - with safe array check
    const team = safeJoinedTeams.find(t => t.id === teamId);
    const role = team?.role || TEAM_ROLES.ADMIN;
    
    localStorage.setItem('activeTeamRole', FirstLetterUpper(role));
    setActiveTeam({ id: teamId, name: teamName, role: role as TeamRole });
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