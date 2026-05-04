import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthProvider';
import { api } from '../lib/api';
import { Project, Task, UserProfile } from '../types';
import { formatDate } from '../lib/utils';

export function ProjectsCenter() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectMembers, setProjectMembers] = useState<UserProfile[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    memberIds: [] as string[],
  });

  const isManager = profile?.role === 'manager';

  const loadProjects = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [projectResult, usersResult] = await Promise.all([
        api.getProjects(profile.uid, profile.role),
        isManager ? api.getUsers('employee') : Promise.resolve({ users: [] }),
      ]);
      setProjects(projectResult.projects);
      setEmployees(usersResult.users);
      if (projectResult.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectResult.projects[0].id);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async () => {
    if (!profile || !selectedProjectId) {
      setProjectMembers([]);
      setProjectTasks([]);
      return;
    }
    try {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (!project) return;
      const [membersResult, tasksResult] = await Promise.all([
        api.getProjectMembers(project),
        api.getProjectTasks(selectedProjectId, profile.uid, profile.role),
      ]);
      setProjectMembers(membersResult.members);
      setProjectTasks(tasksResult.tasks);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load project details');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadProjects();
  }, [authLoading, profile?.uid, profile?.role]);

  useEffect(() => {
    loadProjectDetails();
  }, [selectedProjectId, projects, profile?.uid, profile?.role]);

  const toggleMember = (uid: string) => {
    setNewProject((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(uid)
        ? prev.memberIds.filter((id) => id !== uid)
        : [...prev.memberIds, uid],
    }));
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !isManager) return;
    setCreating(true);
    try {
      const result = await api.createProject({
        managerId: profile.uid,
        name: newProject.name,
        description: newProject.description,
        memberIds: newProject.memberIds,
      });
      toast.success('Project created');
      setProjects((prev) => [result.project, ...prev]);
      setSelectedProjectId(result.project.id);
      setNewProject({ name: '', description: '', memberIds: [] });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || loading) return <div className="p-6">Loading projects...</div>;
  if (!profile) return <div className="p-6 text-gray-500">Please sign in again to load projects.</div>;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-gray-500">
          {isManager
            ? 'Create projects, add team members, and track project tasks.'
            : 'View your project members and tasks by project.'}
        </p>
      </div>

      {isManager && (
        <form onSubmit={createProject} className="card p-5 space-y-3">
          <h3 className="font-semibold">Create Project</h3>
          <input
            className="input-field"
            placeholder="Project name"
            value={newProject.name}
            onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <textarea
            className="input-field"
            placeholder="Project description"
            value={newProject.description}
            onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">Add Employees</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {employees.map((emp) => (
                <label key={emp.uid} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={newProject.memberIds.includes(emp.uid)}
                    onChange={() => toggleMember(emp.uid)}
                  />
                  <span>{emp.displayName}</span>
                  <span className="text-xs text-gray-500">{emp.email}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 space-y-2">
          <h3 className="font-semibold">Project List</h3>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">No projects found.</p>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                className={`w-full text-left rounded-lg px-3 py-2 border ${
                  selectedProjectId === project.id ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedProjectId(project.id)}
              >
                <p className="font-medium">{project.name}</p>
                <p className="text-xs text-gray-500 truncate">{project.description || 'No description'}</p>
              </button>
            ))
          )}
        </div>

        <div className="card p-4 lg:col-span-2 space-y-4">
          {!selectedProject ? (
            <p className="text-sm text-gray-500">Select a project to view members and tasks.</p>
          ) : (
            <>
              <div>
                <h3 className="font-semibold">{selectedProject.name}</h3>
                <p className="text-sm text-gray-500">{selectedProject.description || 'No description'}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Members</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {projectMembers.map((member) => (
                    <div key={member.uid} className="border rounded-lg px-3 py-2">
                      <p className="font-medium text-sm">{member.displayName}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Project Tasks</p>
                <div className="space-y-2">
                  {projectTasks.length === 0 ? (
                    <p className="text-sm text-gray-500">No tasks found in this project.</p>
                  ) : (
                    projectTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg px-3 py-2">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          Status: {task.status} | {formatDate(task.startDate)} - {formatDate(task.endDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
