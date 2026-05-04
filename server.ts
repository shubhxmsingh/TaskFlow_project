import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import firebaseConfigJson from './firebase-applet-config.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type Role = 'admin' | 'manager' | 'employee';
type TaskStatus = 'todo' | 'in-progress' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

interface TaskRecord {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  managerId: string;
  employeeId: string;
  updatedAt: string;
  createdAt: string;
}

const envFirebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys: Array<keyof typeof envFirebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const hasCompleteEnvConfig = requiredKeys.every((key) => Boolean(envFirebaseConfig[key]));

const firebaseConfig = hasCompleteEnvConfig
  ? envFirebaseConfig
  : {
      apiKey: firebaseConfigJson.apiKey,
      authDomain: firebaseConfigJson.authDomain,
      projectId: firebaseConfigJson.projectId,
      storageBucket: firebaseConfigJson.storageBucket,
      messagingSenderId: firebaseConfigJson.messagingSenderId,
      appId: firebaseConfigJson.appId,
    };

const firebaseDatabaseId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || undefined;

console.info(
  `[Server Firebase] Using project "${firebaseConfig.projectId}" (${hasCompleteEnvConfig ? 'env' : 'json fallback'})`
);
console.info(`[Server Firebase] Firestore DB: ${firebaseDatabaseId || '(default)'}`);
const firebaseApp = initializeApp(firebaseConfig);
const db = firebaseDatabaseId ? getFirestore(firebaseApp, firebaseDatabaseId) : getFirestore(firebaseApp);

function parseRole(value: unknown): Role | null {
  return value === 'admin' || value === 'manager' || value === 'employee' ? value : null;
}
function parseStatus(value: unknown): TaskStatus | null {
  return value === 'todo' || value === 'in-progress' || value === 'completed' ? value : null;
}
function parsePriority(value: unknown): TaskPriority | null {
  return value === 'low' || value === 'medium' || value === 'high' ? value : null;
}
function parseString(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
}
function parseDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

async function getUser(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null;
}

async function getUsersMap() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const map = new Map<string, UserProfile>();
  usersSnap.docs.forEach((u) => map.set(u.id, { uid: u.id, ...u.data() } as UserProfile));
  return map;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/users', async (req, res) => {
    try {
      const role = parseRole(req.query.role);
      const q = role ? query(collection(db, 'users'), where('role', '==', role)) : query(collection(db, 'users'));
      const snap = await getDocs(q);
      res.json({ users: snap.docs.map((d) => ({ uid: d.id, ...d.data() })) });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to fetch users' });
    }
  });

  app.get('/api/tasks', async (req, res) => {
    try {
      const userId = parseString(req.query.userId, 8, 128);
      const role = parseRole(req.query.role);
      if (!userId || !role) {
        res.status(400).json({ error: 'userId and role are required' });
        return;
      }
      const usersMap = await getUsersMap();
      const q =
        role === 'admin'
          ? query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
          : role === 'manager'
            ? query(collection(db, 'tasks'), where('managerId', '==', userId), orderBy('createdAt', 'desc'))
            : query(collection(db, 'tasks'), where('employeeId', '==', userId), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const tasks = snap.docs.map((d) => {
        const row = { id: d.id, ...d.data() } as TaskRecord & { id: string };
        return {
          ...row,
          managerName: usersMap.get(row.managerId)?.displayName || row.managerId,
          employeeName: usersMap.get(row.employeeId)?.displayName || row.employeeId,
        };
      });
      res.json({ tasks });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to fetch tasks' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const creatorId = parseString(req.body?.creatorId, 8, 128);
      const managerId = parseString(req.body?.managerId, 8, 128);
      const employeeId = parseString(req.body?.employeeId, 8, 128);
      const title = parseString(req.body?.title, 3, 120);
      const description = parseString(req.body?.description ?? '', 0, 1000) ?? '';
      const priority = parsePriority(req.body?.priority);
      const startDate = parseDate(req.body?.startDate);
      const endDate = parseDate(req.body?.endDate);
      if (!creatorId || !managerId || !employeeId || !title || !priority || !startDate || !endDate) {
        res.status(400).json({ error: 'Invalid payload for task creation' });
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        res.status(400).json({ error: 'startDate cannot be after endDate' });
        return;
      }
      const creator = await getUser(creatorId);
      const manager = await getUser(managerId);
      const employee = await getUser(employeeId);
      if (!creator || !manager || !employee) {
        res.status(404).json({ error: 'creator/manager/employee not found' });
        return;
      }
      if (creator.role !== 'manager' || manager.role !== 'manager' || employee.role !== 'employee') {
        res.status(403).json({ error: 'Only managers can assign tasks to employees' });
        return;
      }
      if (creator.uid !== manager.uid) {
        res.status(403).json({ error: 'Manager can only assign tasks as themselves' });
        return;
      }
      const now = new Date().toISOString();
      const payload: TaskRecord = {
        title,
        description,
        priority,
        status: 'todo',
        startDate,
        endDate,
        managerId,
        employeeId,
        createdAt: now,
        updatedAt: now,
      };
      const ref = await addDoc(collection(db, 'tasks'), payload);
      res.status(201).json({ task: { id: ref.id, ...payload } });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to create task' });
    }
  });

  app.patch('/api/tasks/:taskId', async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const editorId = parseString(req.body?.editorId, 8, 128);
      const startDate = parseDate(req.body?.startDate);
      const endDate = parseDate(req.body?.endDate);
      const title = req.body?.title === undefined ? undefined : parseString(req.body?.title, 3, 120);
      const description =
        req.body?.description === undefined ? undefined : parseString(req.body?.description, 0, 1000);
      if (!editorId) {
        res.status(400).json({ error: 'editorId is required' });
        return;
      }
      if ((req.body?.title !== undefined && !title) || (req.body?.description !== undefined && description === null)) {
        res.status(400).json({ error: 'Invalid title or description' });
        return;
      }
      if ((req.body?.startDate && !startDate) || (req.body?.endDate && !endDate)) {
        res.status(400).json({ error: 'Invalid startDate/endDate' });
        return;
      }
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      const existing = taskSnap.data() as TaskRecord;
      if (existing.managerId !== editorId) {
        res.status(403).json({ error: 'Only assigned manager can edit task dates/details' });
        return;
      }
      const nextStartDate = startDate || existing.startDate;
      const nextEndDate = endDate || existing.endDate;
      if (new Date(nextStartDate) > new Date(nextEndDate)) {
        res.status(400).json({ error: 'startDate cannot be after endDate' });
        return;
      }
      const updates: Partial<TaskRecord> = {
        updatedAt: new Date().toISOString(),
      };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (startDate) updates.startDate = startDate;
      if (endDate) updates.endDate = endDate;
      await updateDoc(taskRef, updates);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to edit task' });
    }
  });

  app.patch('/api/tasks/:taskId/status', async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const updaterId = parseString(req.body?.updaterId, 8, 128);
      const status = parseStatus(req.body?.status);
      if (!updaterId || !status) {
        res.status(400).json({ error: 'updaterId and valid status are required' });
        return;
      }
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      const task = taskSnap.data() as TaskRecord;
      if (task.employeeId !== updaterId) {
        res.status(403).json({ error: 'Only assigned employee can update status' });
        return;
      }
      await updateDoc(taskRef, { status, updatedAt: new Date().toISOString() });
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to update status' });
    }
  });

  app.get('/api/dashboard', async (req, res) => {
    try {
      const userId = parseString(req.query.userId, 8, 128);
      const role = parseRole(req.query.role);
      if (!userId || !role) {
        res.status(400).json({ error: 'userId and role are required' });
        return;
      }
      const usersMap = await getUsersMap();
      const q =
        role === 'admin'
          ? query(collection(db, 'tasks'))
          : role === 'manager'
            ? query(collection(db, 'tasks'), where('managerId', '==', userId))
            : query(collection(db, 'tasks'), where('employeeId', '==', userId));
      const snap = await getDocs(q);
      const now = new Date();
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskRecord & { id: string }));

      const stats = {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === 'todo').length,
        inProgress: tasks.filter((t) => t.status === 'in-progress').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        overdue: tasks.filter((t) => t.status !== 'completed' && new Date(t.endDate) < now).length,
      };

      const recentTasks = [...tasks]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)
        .map((t) => ({
          ...t,
          managerName: usersMap.get(t.managerId)?.displayName || t.managerId,
          employeeName: usersMap.get(t.employeeId)?.displayName || t.employeeId,
        }));

      const assignmentView =
        role !== 'admin'
          ? []
          : tasks.map((t) => ({
              taskTitle: t.title,
              managerName: usersMap.get(t.managerId)?.displayName || t.managerId,
              employeeName: usersMap.get(t.employeeId)?.displayName || t.employeeId,
              status: t.status,
            }));

      res.json({ stats, recentTasks, assignmentView });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to fetch dashboard' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '365d',
        immutable: true,
      })
    );
    app.use(
      express.static(distPath, {
        maxAge: '1h',
      })
    );
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
