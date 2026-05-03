import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { Project, Task, TaskStatus, TaskPriority } from '../types';
import { ArrowLeft, Plus, CheckCircle2, Clock, ListTodo, MoreHorizontal, UserPlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { formatDate, cn } from '../lib/utils';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeId: user?.uid || '',
    priority: 'medium' as TaskPriority,
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchProject = async () => {
      const docRef = doc(db, 'projects', projectId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() } as Project);
      }
    };
    fetchProject();

    // Listen to tasks
    const tasksRef = collection(db, 'projects', projectId, 'tasks');
    const q = query(tasksRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title.trim()) return;

    try {
      await addDoc(collection(db, 'projects', projectId, 'tasks'), {
        ...newTask,
        projectId,
        status: 'todo',
        creatorId: user.uid,
        createdAt: new Date().toISOString(),
      });
      setShowAddTask(false);
      setNewTask({ ...newTask, title: '', description: '' });
      toast.success('Task added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add task');
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), {
        status,
        updatedAt: new Date().toISOString()
      });
      toast.success('Status updated');
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId));
      toast.success('Task deleted');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

  if (loading) return <div>Loading project details...</div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{project.name}</h1>
            <p className="text-gray-500 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <UserPlus size={18} />
              Share
            </button>
            <button 
              onClick={() => setShowAddTask(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Task
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--color-brand-line)]">
        {(['all', 'todo', 'in-progress', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-all relative",
              filter === f ? "text-black" : "text-gray-500 hover:text-black"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
            {filter === f && (
              <motion.div layoutId="filter-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 card bg-gray-50/50 border-dashed">
            <ListTodo size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tasks found for this category.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 group hover:border-black transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "w-3 h-3 rounded-full",
                      task.priority === 'high' ? "bg-red-500" : task.priority === 'medium' ? "bg-amber-500" : "bg-blue-500"
                    )} />
                    <h3 className={cn("font-bold text-lg truncate", task.status === 'completed' && "line-through text-gray-400")}>
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1 mb-3">{task.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(task.dueDate)}
                    </div>
                    {task.assigneeId && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Assigned
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select 
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showAddTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">New Task</h2>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Title</label>
                  <input 
                    type="text" 
                    required
                    className="input-field" 
                    placeholder="e.g. Design Landing Page"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <textarea 
                    className="input-field min-h-[80px]" 
                    placeholder="Details about the task..."
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Priority</label>
                    <select 
                      className="input-field"
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Due Date</label>
                    <input 
                      type="date"
                      required
                      className="input-field"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddTask(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Add Task</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
