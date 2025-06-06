import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useJoinedTeams } from '@/features/team';
import { useTeam } from '@/features/team';
import axios from '@/lib/axios';

interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
  }>;
}

interface TeamSwitchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamSwitchModal({ open, onOpenChange }: TeamSwitchModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTeams();
    }
  }, [open]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
              const response = await axios.get('/teams/joined');
      setTeams(response.data);
    } catch (err) {
      setError('Failed to fetch teams');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const { toast } = useToast();

  const { switchTeam } = useTeam();

  const handleTeamSelect = (team: Team) => {
    switchTeam(team.id, team.name);
    onOpenChange(false);
    toast({
      title: "Team Changed",
      description: `Successfully switched to team: ${team.name}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Team</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-4">
          {loading ? (
            <div className="text-center">Loading teams...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            teams.map((team) => (
              <Button
                key={team.id}
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => handleTeamSelect(team)}
              >
                {team.name}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}