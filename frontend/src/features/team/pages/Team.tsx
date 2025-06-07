import { Pencil, Trash2 } from 'lucide-react';
import { useJoinedTeams } from '@/features/team';
import { useTeam } from '@/features/team';
import { InviteTeamModal } from '@/components/modals/InviteTeamModal';
import { RoleChangeModal } from '@/components/modals/RoleChangeModal';
import { DeleteMemberModal } from '@/components/modals/DeleteMemberModal';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { useState } from 'react';
import { FirstLetterUpper } from '@/lib/utils';
import { TEAM_ROLES } from '@/constants/teamRoles';

const Team = () => {
  const { activeTeam } = useTeam();
  const { data: joinedTeams, isLoading: joinedLoading, error: joinedError } = useJoinedTeams();
  const [selectedMember, setSelectedMember] = useState<{
    userId: string;
    email: string;
    role: string;
  } | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMemberForDelete, setSelectedMemberForDelete] = useState<{
    userId: string;
    email: string;
  } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (joinedLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <div className="text-gray-500">Loading team members...</div>
      </div>
    );
  }

  if (joinedError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-red-500">Failed to load team data</div>
      </div>
    );
  }

  // Find the current team data from joined teams (it has complete member info with roles)
  const currentTeamData = joinedTeams?.find(team => team.id === activeTeam?.id);
  
  // Get members with complete role information
  const members = currentTeamData?.members || [];

  const memberColumns: DataTableColumn<any>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (member) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{member.name}</div>
          <div className="text-sm text-gray-500">{member.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (member) => (
        <span className="text-sm text-gray-500">
          {member.role ? FirstLetterUpper(member.role) : 'Unknown'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (member) => (
        <Badge status={member.status.toLowerCase() as "active" | "inviting" | "reject"}>
          {member.status}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (member) => (
        <div className="flex gap-2">
          <button 
            className="text-blue-500 hover:text-blue-700"
            onClick={() => {
              setSelectedMember({
                userId: member.userId,
                email: member.email,
                role: member.role || 'unknown'
              });
              setIsRoleModalOpen(true);
            }}
            disabled={member.role === TEAM_ROLES.OWNER}
            style={{ opacity: member.role === TEAM_ROLES.OWNER ? 0.5 : 1 }}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            className="text-red-500 hover:text-red-700"
            onClick={() => {
              setSelectedMemberForDelete({
                userId: member.userId,
                email: member.email
              });
              setIsDeleteModalOpen(true);
            }}
            disabled={member.role === TEAM_ROLES.OWNER}
            style={{ opacity: member.role === TEAM_ROLES.OWNER ? 0.5 : 1 }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-gray-500">Manage your team access</p>
        </div>
        <InviteTeamModal />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          data={members}
          columns={memberColumns}
          isLoading={joinedLoading}
          error={!!joinedError}
          emptyMessage="No team members found"
          showPagination={false}
          getRowKey={(member) => member.userId}
        />
      </div>
      {selectedMember && (
        <RoleChangeModal
          open={isRoleModalOpen}
          onOpenChange={setIsRoleModalOpen}
          teamId={activeTeam?.id || ''}
          userId={selectedMember.userId}
          email={selectedMember.email}
          currentRole={selectedMember.role}
        />
      )}
      {selectedMemberForDelete && (
        <DeleteMemberModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          teamId={activeTeam?.id || ''}
          userId={selectedMemberForDelete.userId}
          email={selectedMemberForDelete.email}
        />
      )}
    </div>
  );
};

export default Team;