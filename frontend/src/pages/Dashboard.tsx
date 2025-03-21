import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Quick Stats</h3>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Quizzes</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-medium">0</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Create New Quiz
            </button>
            <button className="w-full rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90">
              Browse Quizzes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;