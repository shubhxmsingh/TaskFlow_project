import { Role, Task, TaskPriority, TaskStatus, UserProfile } from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getUsers: (role?: Role) =>
    request<{ users: UserProfile[] }>(`/api/users${role ? `?role=${encodeURIComponent(role)}` : ''}`),

  getTasks: (userId: string, role: Role) =>
    request<{ tasks: Task[] }>(
      `/api/tasks?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`
    ),

  createTask: (input: {
    creatorId: string;
    managerId: string;
    employeeId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    startDate: string;
    endDate: string;
  }) =>
    request<{ task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  editTask: (
    taskId: string,
    input: { editorId: string; title?: string; description?: string; startDate?: string; endDate?: string }
  ) =>
    request<{ ok: boolean }>(`/api/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  updateTaskStatus: (taskId: string, updaterId: string, status: TaskStatus) =>
    request<{ ok: boolean }>(`/api/tasks/${encodeURIComponent(taskId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ updaterId, status }),
    }),

  getDashboard: (userId: string, role: Role) =>
    request<{
      stats: { total: number; todo: number; inProgress: number; completed: number; overdue: number };
      recentTasks: Task[];
      assignmentView: Array<{ taskTitle: string; managerName: string; employeeName: string; status: TaskStatus }>;
    }>(`/api/dashboard?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`),
};
