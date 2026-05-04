import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, Role, Task, TaskPriority, TaskStatus, UserProfile } from '../types';

export const api = {
  async getUsers(role?: Role) {
    const usersRef = collection(db, 'users');
    const q = role ? query(usersRef, where('role', '==', role)) : query(usersRef);
    const snap = await getDocs(q);
    return { users: snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)) };
  },

  async getTasks(userId: string, role: Role) {
    const tasksRef = collection(db, 'tasks');
    const q =
      role === 'admin'
        ? query(tasksRef)
        : role === 'manager'
          ? query(tasksRef, where('managerId', '==', userId))
          : query(tasksRef, where('employeeId', '==', userId));
    const snap = await getDocs(q);

    const managerIds = new Set<string>();
    const employeeIds = new Set<string>();
    snap.docs.forEach((d) => {
      const row = d.data() as Task;
      managerIds.add(row.managerId);
      employeeIds.add(row.employeeId);
    });

    const usersMap = new Map<string, string>();
    await Promise.all(
      [...new Set([...managerIds, ...employeeIds])].map(async (uid) => {
        const u = await getDoc(doc(db, 'users', uid));
        if (u.exists()) usersMap.set(uid, (u.data() as UserProfile).displayName || uid);
      })
    );

    return {
      tasks: snap.docs
        .map((d) => {
          const row = { id: d.id, ...d.data() } as Task;
          return {
            ...row,
            managerName: usersMap.get(row.managerId) || row.managerId,
            employeeName: usersMap.get(row.employeeId) || row.employeeId,
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  },

  async createTask(input: {
    creatorId: string;
    managerId: string;
    employeeId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    startDate: string;
    endDate: string;
    projectId?: string;
  }) {
    const now = new Date().toISOString();
    const payload: Omit<Task, 'id' | 'managerName' | 'employeeName'> = {
      title: input.title.trim(),
      description: input.description.trim(),
      managerId: input.managerId,
      employeeId: input.employeeId,
      ...(input.projectId ? { projectId: input.projectId } : {}),
      status: 'todo',
      priority: input.priority,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await addDoc(collection(db, 'tasks'), payload);
    return { task: { id: ref.id, ...payload } };
  },

  async getProjects(userId: string, role: Role) {
    const projectsRef = collection(db, 'projects');
    const q =
      role === 'admin'
        ? query(projectsRef)
        : role === 'manager'
          ? query(projectsRef, where('managerId', '==', userId))
          : query(projectsRef, where('memberIds', 'array-contains', userId));
    const snap = await getDocs(q);
    return {
      projects: snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Project))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  },

  async createProject(input: {
    managerId: string;
    name: string;
    description: string;
    memberIds: string[];
  }) {
    const now = new Date().toISOString();
    const uniqueMemberIds = [...new Set([input.managerId, ...input.memberIds])];
    const payload: Omit<Project, 'id'> = {
      name: input.name.trim(),
      description: input.description.trim(),
      managerId: input.managerId,
      memberIds: uniqueMemberIds,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await addDoc(collection(db, 'projects'), payload);
    return { project: { id: ref.id, ...payload } };
  },

  async getProjectMembers(project: Project) {
    const members = await Promise.all(
      project.memberIds.map(async (uid) => {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) {
          return {
            uid,
            email: uid,
            displayName: uid,
            role: 'employee' as Role,
            createdAt: '',
          } as UserProfile;
        }
        return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
      })
    );
    return { members };
  },

  async getProjectTasks(projectId: string, userId: string, role: Role) {
    const tasksRef = collection(db, 'tasks');
    const base = query(tasksRef, where('projectId', '==', projectId));
    const q =
      role === 'employee'
        ? query(tasksRef, where('projectId', '==', projectId), where('employeeId', '==', userId))
        : base;
    const snap = await getDocs(q);
    return {
      tasks: snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Task))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  },

  async editTask(
    taskId: string,
    input: { editorId: string; title?: string; description?: string; startDate?: string; endDate?: string }
  ) {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) throw new Error('Task not found');
    const task = taskSnap.data() as Task;
    if (task.managerId !== input.editorId) {
      throw new Error('Only assigned manager can edit this task');
    }
    const updates: Partial<Task> = { updatedAt: new Date().toISOString() };
    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.description !== undefined) updates.description = input.description.trim();
    if (input.startDate !== undefined) updates.startDate = input.startDate;
    if (input.endDate !== undefined) updates.endDate = input.endDate;
    await updateDoc(taskRef, updates);
    return { ok: true };
  },

  async updateTaskStatus(taskId: string, updaterId: string, status: TaskStatus) {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) throw new Error('Task not found');
    const task = taskSnap.data() as Task;
    if (task.employeeId !== updaterId) {
      throw new Error('Only assigned employee can update status');
    }
    await updateDoc(taskRef, { status, updatedAt: new Date().toISOString() });
    return { ok: true };
  },

  async getDashboard(userId: string, role: Role) {
    const { tasks } = await this.getTasks(userId, role);
    const now = new Date();
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue: tasks.filter((t) => t.status !== 'completed' && new Date(t.endDate) < now).length,
    };
    return {
      stats,
      recentTasks: [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      assignmentView:
        role === 'admin'
          ? tasks.map((t) => ({
              taskTitle: t.title,
              managerName: t.managerName || t.managerId,
              employeeName: t.employeeName || t.employeeId,
              status: t.status,
            }))
          : [],
    } as {
      stats: { total: number; todo: number; inProgress: number; completed: number; overdue: number };
      recentTasks: Task[];
      assignmentView: Array<{ taskTitle: string; managerName: string; employeeName: string; status: TaskStatus }>;
    };
  },
};
