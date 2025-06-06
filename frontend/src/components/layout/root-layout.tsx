import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '../ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TeamSwitchModal } from '../modals/TeamSwitchModal';
import { Toaster } from "@/components/ui/toaster";
import { useTeam } from '@/features/team';
import { TEAM_ROLES } from '@/constants/teamRoles';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [teamSwitchOpen, setTeamSwitchOpen] = useState(false);
  const { activeTeam } = useTeam();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getMenuItemClassName = (path: string) => {
    const baseClasses = 'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50';
    return `${baseClasses} ${location.pathname === path ? 'bg-accent/50 font-extrabold text-yellow-500' : ''}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded border p-1">Logo</div>
              <span className="text-lg font-semibold">Quiz APP</span>
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/dashboard" className={getMenuItemClassName('/dashboard')}>Dashboard</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/tests" className={getMenuItemClassName('/tests')}>Tests</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/candidates" className={getMenuItemClassName('/candidates')}>Candidates</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/library" className={getMenuItemClassName('/library')}>Library</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm">Welcome, {user?.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar>
                  <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <button onClick={() => setTeamSwitchOpen(true)} className="w-full text-left">
                    {activeTeam?.name || 'Select Team'} (change)
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <Link to="/profile" className="w-full">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/team" className="w-full">
                    Team
                  </Link>
                </DropdownMenuItem>
                {(activeTeam?.role === TEAM_ROLES.OWNER || activeTeam?.role === TEAM_ROLES.BILLING) && (
                  <DropdownMenuItem>
                    <Link to="/billing" className="w-full">
                      Billing
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <TeamSwitchModal open={teamSwitchOpen} onOpenChange={setTeamSwitchOpen} />
      <Toaster />
    </div>
  );
};

export default RootLayout;