export type Role = 'admin' | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  creatorId: string;
  createdAt: string;
  updatedAt?: string;
}
