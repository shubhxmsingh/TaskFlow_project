import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { Project } from '../types';
import { Plus, Folder, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface ProjectsListProps {
  onSelect: (id: string) => void;
}

export function ProjectsList({ onSelect }: ProjectsListProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, 'projects'), where('memberIds', 'array-contains', user.uid));
        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newProject.name.trim()) return;

    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...newProject,
        ownerId: user.uid,
        memberIds: [user.uid],
        createdAt: new Date().toISOString(),
      });
      setProjects([...projects, { id: docRef.id, ...newProject, ownerId: user.uid, memberIds: [user.uid], createdAt: new Date().toISOString() } as Project]);
      setShowCreate(false);
      setNewProject({ name: '', description: '' });
      toast.success('Project created!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create project');
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-gray-500">Manage and organize your team workspaces.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(project.id)}
            className="card p-6 cursor-pointer hover:border-black transition-all hover:shadow-lg group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-gray-600 group-hover:bg-black group-hover:text-white transition-colors">
              <Folder size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{project.name}</h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description || 'No description provided.'}</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-brand-line)]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Users size={14} />
                {project.memberIds.length} Members
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      {projects.length === 0 && !showCreate && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Folder size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No projects yet</h3>
          <p className="text-gray-500 mb-6">Create your first project to start working with your team.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Project</button>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Project Name</label>
                  <input 
                    type="text" 
                    required
                    className="input-field" 
                    placeholder="e.g. Website Redesign"
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Description (Optional)</label>
                  <textarea 
                    className="input-field min-h-[100px]" 
                    placeholder="Describe what this project is about..."
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
