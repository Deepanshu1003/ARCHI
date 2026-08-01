import React, { useState, useEffect } from 'react';
import { Project } from './types';
import { HomeView } from './components/HomeView';
import { SetupView } from './components/SetupView';
import { DashboardView } from './components/DashboardView';
import { createDefaultProject } from './utils/defaultProject';

export default function App() {
  const [phase, setPhase] = useState<'home' | 'setup' | 'execution'>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Load projects from API / localStorage on mount
  useEffect(() => {
    async function loadProjects() {
      let backendProjects: Project[] = [];
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            backendProjects = data;
          }
        }
      } catch (err) {
        console.warn('Backend fetch failed, falling back to local state:', err);
      }

      // Check localStorage fallback
      const local = localStorage.getItem('agentic_projects');
      let localProjects: Project[] = [];
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            localProjects = parsed;
          }
        } catch (e) {
          console.error('Error parsing localStorage projects', e);
        }
      }

      // Merge / sync: if backend has projects, use them. If backend is empty but local has projects, persist local projects to backend!
      let finalProjects = backendProjects;
      if (backendProjects.length === 0 && localProjects.length > 0) {
        finalProjects = localProjects;
        // Push local projects to backend database
        for (const p of localProjects) {
          try {
            await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(p)
            });
          } catch (e) {
            console.warn('Failed to sync local project to backend db:', e);
          }
        }
      } else if (backendProjects.length > 0) {
        localStorage.setItem('agentic_projects', JSON.stringify(backendProjects));
      }

      setProjects(finalProjects);
      setLoading(false);
    }

    loadProjects();
  }, []);

  const handleDeleteAllProjects = async () => {
    try {
      await fetch('/api/projects', { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to clear projects on backend:', err);
    }
    localStorage.removeItem('agentic_projects');
    setProjects([]);
    setCurrentProject(null);
    setPhase('home');
  };

  // Save project helper
  const saveProjectToBackend = async (proj: Project) => {
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proj)
      });
    } catch (err) {
      console.warn('Failed to persist to backend:', err);
    }
    // Always update localStorage as well
    setProjects(prev => {
      const updated = prev.map(p => p.id === proj.id ? proj : p);
      if (!prev.some(p => p.id === proj.id)) {
        updated.push(proj);
      }
      localStorage.setItem('agentic_projects', JSON.stringify(updated));
      return updated;
    });
  };

  const handleStartNewProject = (project: Project) => {
    saveProjectToBackend(project);
    setCurrentProject(project);
    setPhase('setup');
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setPhase('execution');
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setPhase('setup');
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to delete on backend:', err);
    }
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== projectId);
      localStorage.setItem('agentic_projects', JSON.stringify(updated));
      return updated;
    });
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setPhase('home');
    }
  };

  const handleStartExecution = (updatedProject: Project) => {
    saveProjectToBackend(updatedProject);
    setCurrentProject(updatedProject);
    setPhase('execution');
  };

  const handleUpdateProjectFromDashboard = (updatedProject: Project) => {
    setCurrentProject(updatedProject);
    saveProjectToBackend(updatedProject);
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
