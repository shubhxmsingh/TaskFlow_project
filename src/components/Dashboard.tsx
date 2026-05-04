import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ListChecks, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { api } from '../lib/api';
import { Task } from '../types';
import { formatDate } from '../lib/utils';
import { motion } from 'motion/react';

export function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [assignmentView, setAssignmentView] = useState<
    Array<{ taskTitle: string; managerName: string; employeeName: string; status: string }>
  >([]);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getDashboard(profile.uid, profile.role);
        setStats(data.stats);
        setRecentTasks(data.recentTasks);
        setAssignmentView(data.assignmentView);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 capitalize">Signed in as {profile?.role}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: ListChecks, bg: 'from-indigo-500 to-violet-500' },
          { label: 'To Do', value: stats.todo, icon: Clock, bg: 'from-cyan-500 to-blue-500' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, bg: 'from-amber-500 to-orange-500' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, bg: 'from-emerald-500 to-teal-500' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, bg: 'from-rose-500 to-pink-500' },
        ].map((card, index) => (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            key={card.label}
            className={`rounded-2xl p-4 text-white shadow-[0_12px_24px_rgba(0,0,0,0.16)] bg-gradient-to-br ${card.bg}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/85">{card.label}</p>
              <card.icon size={16} className="text-white/90" />
            </div>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-5 bg-gradient-to-br from-white to-indigo-50/40">
        <h3 className="font-semibold mb-3">Recent Tasks</h3>
        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks found.</p>
          ) : (
            recentTasks.map((task) => (
              <div key={task.id} className="border border-indigo-100 rounded-xl p-3 bg-white/80">
                <p className="font-medium text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-600">
                  {task.managerName} → {task.employeeName} | {task.status} | {formatDate(task.endDate)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {profile?.role === 'admin' && (
        <div className="card p-5 bg-gradient-to-br from-white to-cyan-50/40">
          <h3 className="font-semibold mb-3">Manager to Employee Assignments</h3>
          <div className="space-y-2">
            {assignmentView.length === 0 ? (
              <p className="text-sm text-gray-500">No assignments found.</p>
            ) : (
              assignmentView.map((row, idx) => (
                <p key={`${row.taskTitle}-${idx}`} className="text-sm">
                  <span className="font-medium">{row.managerName}</span> assigned{' '}
                  <span className="font-medium">{row.employeeName}</span> - {row.taskTitle} ({row.status})
                </p>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
