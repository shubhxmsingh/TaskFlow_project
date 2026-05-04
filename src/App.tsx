import { AuthProvider, useAuth } from './components/AuthProvider';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { TaskCenter } from './components/TaskCenter';
import { ProjectsCenter } from './components/ProjectsCenter';

function MainApp() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'projects'>('dashboard');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-brand-bg)]">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
        }} 
      />
      
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Dashboard />
            </motion.div>
          ) : activeTab === 'tasks' ? (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TaskCenter />
            </motion.div>
          ) : (
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProjectsCenter />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <Toaster position="bottom-right" />
    </AuthProvider>
  );
}

