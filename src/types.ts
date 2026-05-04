export type Role = 'admin' | 'manager' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  photoURL?: string;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  managerId: string;
  managerName?: string;
  employeeId: string;
  employeeName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  managerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt?: string;
}
