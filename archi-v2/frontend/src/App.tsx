import React, { useCallback, useEffect, useState } from 'react';
import { Project } from './types';
import { HomeView } from './components/HomeView';
import { SetupView } from './components/SetupView';
import { DashboardView } from './components/DashboardView';
import * as api from './api';

/**
 * The backend is the single source of truth. v1 kept a localStorage shadow
 * copy and reconciled the two on boot; that is gone, so what you see is what
 * the server has.
 */
export default function App() {
  const [phase, setPhase] = useState<'home' | 'setup' | 'execution'>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await api.getProjects());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const persist = async (project: Project) => {
    try {
      const saved = await api.saveProject(project);
      setCurrentProject(saved);
      setProjects(previous => {
        const exists = previous.some(item => item.id === saved.id);
        return exists
          ? previous.map(item => (item.id === saved.id ? saved : item))
          : [...previous, saved];
      });
      setError(null);
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  };

  const handleDeleteAllProjects = async () => {
    try {
      await Promise.all(projects.map(project => api.deleteProject(project.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setProjects([]);
    setCurrentProject(null);
    setPhase('home');
  };

  const handleStartNewProject = async (project: Project) => {
    await persist(project);
    setCurrentProject(project);
    setPhase('setup');
  };

  const handleOpenProject = async (project: Project) => {
    try {
      setCurrentProject(await api.getProject(project.id));
    } catch {
      setCurrentProject(project);
    }
    setPhase('execution');
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setPhase('setup');
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setProjects(previous => previous.filter(item => item.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setPhase('home');
    }
  };

  const handleStartExecution = async (updatedProject: Project) => {
    const saved = await persist(updatedProject);
    setCurrentProject(saved ?? updatedProject);
    setPhase('execution');
  };

  const handleUpdateProjectFromDashboard = (updatedProject: Project) => {
    setCurrentProject(updatedProject);
    setProjects(previous =>
      previous.map(item => (item.id === updatedProject.id ? updatedProject : item)),
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Loading Agentic Organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col">
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button className="underline" onClick={() => loadProjects()}>
            Retry
          </button>
        </div>
      )}
      {phase === 'home' && (
        <HomeView
          projects={projects}
          onStartNew={handleStartNewProject}
          onOpenProject={handleOpenProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onDeleteAllProjects={handleDeleteAllProjects}
          onUpdateProject={handleUpdateProjectFromDashboard}
        />
      )}
      {phase === 'setup' && currentProject && (
        <SetupView
          project={currentProject}
          onStartExecution={handleStartExecution}
          onBack={() => setPhase('home')}
        />
      )}
      {phase === 'execution' && currentProject && (
        <DashboardView
          project={currentProject}
          onBack={() => setPhase('home')}
          onUpdateProject={handleUpdateProjectFromDashboard}
          onDeleteProject={handleDeleteProject}
          onEditTeam={() => setPhase('setup')}
        />
      )}
    </div>
  );
}
