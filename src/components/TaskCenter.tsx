import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthProvider';
import { api } from '../lib/api';
import { Project, Task, TaskStatus, UserProfile } from '../types';
import { formatDate } from '../lib/utils';

export function TaskCenter() {
  const { profile, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    projectId: '',
    title: '',
    description: '',
    employeeId: '',
    priority: 'medium' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const canAssign = profile?.role === 'manager';

  const load = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [taskResult, employeeResult, allUsersResult] = await Promise.all([
        api.getTasks(profile.uid, profile.role),
        canAssign ? api.getUsers('employee') : Promise.resolve({ users: [] }),
        canAssign ? api.getUsers() : Promise.resolve({ users: [] }),
      ]);
      const projectResult = canAssign
        ? await api.getProjects(profile.uid, profile.role)
        : { projects: [] as Project[] };
      setTasks(taskResult.tasks);
      setProjects(projectResult.projects);
      const explicitEmployees = employeeResult.users;
      const fallbackEmployees = allUsersResult.users.filter(
        (u) => u.uid !== profile.uid && u.role !== 'admin'
      );
      const resolvedEmployees = explicitEmployees.length > 0 ? explicitEmployees : fallbackEmployees;
      setEmployees(resolvedEmployees);
      if (canAssign && resolvedEmployees.length > 0 && !form.employeeId) {
        setForm((prev) => ({
          ...prev,
          employeeId: resolvedEmployees[0].uid,
          projectId: projectResult.projects[0]?.id || prev.projectId,
        }));
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, profile?.uid, profile?.role]);

  const canEmployeeUpdate = useMemo(() => profile?.role === 'employee', [profile?.role]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await api.createTask({
        creatorId: profile.uid,
        managerId: profile.uid,
        employeeId: form.employeeId,
        title: form.title,
        description: form.description,
        priority: form.priority,
        startDate: form.startDate,
        endDate: form.endDate,
        projectId: form.projectId || undefined,
      });
      toast.success('Task assigned');
      setForm((prev) => ({ ...prev, title: '', description: '' }));
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign task');
    }
  };

  const editTaskDates = async (task: Task) => {
    if (!profile) return;
    const startDate = prompt('Start date (YYYY-MM-DD)', task.startDate);
    if (!startDate) return;
    const endDate = prompt('End date (YYYY-MM-DD)', task.endDate);
    if (!endDate) return;
    try {
      await api.editTask(task.id, { editorId: profile.uid, startDate, endDate });
      toast.success('Task dates updated');
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to edit task');
    }
  };

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    if (!profile) return;
    try {
      await api.updateTaskStatus(taskId, profile.uid, status);
      toast.success('Status updated');
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update status');
    }
  };

  if (authLoading || loading) return <div className="p-6">Loading tasks...</div>;
  if (!profile) return <div className="p-6 text-gray-500">Please sign in again to load tasks.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-gray-500">
          {profile?.role === 'admin'
            ? 'Admin view: all assignments and statuses'
            : profile?.role === 'manager'
              ? 'Manager view: assign tasks and edit task dates'
              : 'Employee view: update your task status'}
        </p>
      </div>

      {canAssign && (
        <form onSubmit={createTask} className="card p-5 space-y-3">
          <h3 className="font-semibold">Assign Task</h3>
          <input
            className="input-field"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <textarea
            className="input-field"
            placeholder="Task description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              className="input-field"
              value={form.projectId}
              onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
              required
            >
              {projects.length === 0 ? (
                <option value="" disabled>
                  Create project first
                </option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
            <select
              className="input-field"
              value={form.employeeId}
              onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
              required
            >
              {employees.length === 0 ? (
                <option value="" disabled>
                  No employees available
                </option>
              ) : (
                employees.map((emp) => (
                  <option key={emp.uid} value={emp.uid}>
                    {emp.displayName}
                  </option>
                ))
              )}
            </select>
            <select
              className="input-field"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as any }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              className="input-field"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              required
            />
            <input
              className="input-field"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>
          <button className="btn-primary" type="submit">
            Assign Task
          </button>
        </form>
      )}

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="card p-5 text-gray-500">No tasks found.</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    Manager: {task.managerName} | Employee: {task.employeeName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(task.startDate)} - {formatDate(task.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{task.priority}</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{task.status}</span>
                  {profile?.role === 'manager' && (
                    <button className="btn-secondary text-xs" onClick={() => editTaskDates(task)}>
                      Edit Dates
                    </button>
                  )}
                  {canEmployeeUpdate && (
                    <select
                      className="input-field text-xs py-1"
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
