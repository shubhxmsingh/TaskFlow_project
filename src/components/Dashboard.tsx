import { useEffect, useState } from 'react';
import { collectionGroup, query, where, getDocs, collection, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { Task, Project } from '../types';
import { CheckCircle2, Clock, ListChecks, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';

interface DashboardProps {
  onSelectProject: (id: string) => void;
}

export function Dashboard({ onSelectProject }: DashboardProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      try {
        // In a real app we'd use Firestore rules to only query user's tasks
        // Since tasks are in projects/{id}/tasks, we use collectionGroup
        const tasksQuery = query(
          collectionGroup(db, 'tasks'),
          where('assigneeId', '==', profile.uid)
        );
        
        const snapshot = await getDocs(tasksQuery);
        const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
        
        const now = new Date().toISOString();
        
        setStats({
          total: tasks.length,
          todo: tasks.filter(t => t.status === 'todo').length,
          inProgress: tasks.filter(t => t.status === 'in-progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          overdue: tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < now).length
        });

        // Get 5 most recent tasks
        setRecentTasks(tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: ListChecks, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Overdue', value: stats.stats_overdue || stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  if (loading) {
    return <div className="space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {profile?.displayName?.split(' ')[0]}</h1>
        <p className="text-gray-500">Here's an overview of your team activities and tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Tasks</h2>
          <div className="card divide-y divide-[var(--color-brand-line)]">
            {recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tasks found.</div>
            ) : (
              recentTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectProject(task.projectId)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{task.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Due {formatDate(task.dueDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle size={12} />
                      Priority: {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Team Performance</h2>
          <div className="card p-6 h-full flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 rounded-full border-[12px] border-gray-100 border-t-black flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </span>
            </div>
            <h4 className="font-semibold mb-1">Tasks Completed</h4>
            <p className="text-sm text-gray-500">You've completed {stats.completed} out of {stats.total} total assigned tasks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
