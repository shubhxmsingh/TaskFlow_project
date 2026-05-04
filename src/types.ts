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
