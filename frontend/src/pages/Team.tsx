import { Pencil, Trash2 } from 'lucide-react';
import { useTeam } from '@/contexts/TeamContext';
import { InviteTeamModal } from '@/components/modals/InviteTeamModal';
import { RoleChangeModal } from '@/components/modals/RoleChangeModal';
import { DeleteMemberModal } from '@/components/modals/DeleteMemberModal';
import { useState } from 'react';

const Team = () => {
  const { members, loading, error, activeTeam } = useTeam();
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

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <div className="text-gray-500">Loading team members...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.userId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button 
                    className="text-blue-500 hover:text-blue-700 mr-4"
                    onClick={() => {
                      setSelectedMember({
                        userId: member.userId,
                        email: member.email,
                        role: member.role
                      });
                      setIsRoleModalOpen(true);
                    }}
                    disabled={member.role === 'Owner'}
                    style={{ opacity: member.role === 'Owner' ? 0.5 : 1 }}
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
                    disabled={member.role === 'Owner'}
                    style={{ opacity: member.role === 'Owner' ? 0.5 : 1 }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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