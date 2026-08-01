import React, { useState } from 'react';
import { Network, Plus, FolderOpen, Trash2, Edit3, Play, Users, Sparkles, Info, Code } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';
import { createDefaultProject } from '../utils/defaultProject';
import { ProjectOverviewModal } from './ProjectOverviewModal';

interface HomeViewProps {
  projects: Project[];
  onStartNew: (project: Project) => void;
  onOpenProject: (project: Project, agentId?: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteAllProjects?: () => void;
  onUpdateProject?: (updatedProject: Project) => void;
}

export function HomeView({ projects, onStartNew, onOpenProject, onEditProject, onDeleteProject, onDeleteAllProjects, onUpdateProject }: HomeViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState('Enterprise AI Ecosystem');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  
  // Overview and Delete modal states
  const [overviewProject, setOverviewProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectNameInput.trim()) return;

    if (jsonInput.trim()) {
      try {
        let parsed: any;
        const raw = jsonInput.trim();
        try {
          parsed = JSON.parse(raw);
        } catch (jsonErr) {
          // Fallback to evaluating JS object literal if standard JSON.parse fails (e.g. unquoted keys)
          parsed = (new Function('return ' + raw))();
        }

        if (!parsed || !parsed.agents || !parsed.rootAgentId) {
          throw new Error('Invalid project JSON structure: missing agents or rootAgentId.');
        }
        const newProject: Project = {
          id: parsed.id || uuidv4(),
          name: projectNameInput.trim() || parsed.name || 'Custom Project',
          description: parsed.description || 'Imported team structure.',
          createdAt: parsed.createdAt || Date.now(),
          rootAgentId: parsed.rootAgentId,
          agents: parsed.agents,
          genesisDocuments: parsed.genesisDocuments || []
        };
        onStartNew(newProject);
        setShowModal(false);
        setProjectNameInput('Enterprise AI Ecosystem');
        setJsonInput('');
        setJsonError('');
        return;
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON format');
        return;
      }
    }

    const newProject = createDefaultProject(projectNameInput.trim(), 'head_only');

    onStartNew(newProject);
    setShowModal(false);
    setProjectNameInput('Enterprise AI Ecosystem');
    setJsonInput('');
    setJsonError('');
  };

  return (
    <div className="flex-1 flex flex-col items-center pt-16 px-6 max-w-6xl mx-auto w-full pb-16">
      {/* Header Badge */}
      <div className="bg-indigo-600 p-4 rounded-2xl text-white mb-6 shadow-xl shadow-indigo-200/50">
        <Network className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-display font-bold mb-1 text-neutral-900 text-center tracking-tight">
        ARCHI
      </h1>
      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
        Agentic Role-based Collaborative Hierarchical Infrastructure
      </p>
      <p className="text-neutral-500 mb-10 max-w-xl text-center leading-relaxed text-sm">
        Collaborate with a hierarchical team of specialized AI agents. Design your workforce, 
        draft architecture blueprints, and delegate structural domain decisions down the chain.
      </p>

      {/* Action Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Create New Project Card */}
        <button 
          onClick={() => setShowModal(true)}
          className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-2xl transition-all group shadow-sm"
        >
          <div className="bg-indigo-100 group-hover:bg-indigo-600 p-4 rounded-full mb-4 transition-colors">
            <Plus className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
          </div>
          <span className="font-bold text-neutral-800 group-hover:text-indigo-700 text-base">
            Start a New Project
          </span>
          <span className="text-xs text-neutral-400 mt-1">Configure name & team hierarchy</span>
        </button>

        {/* Info Cards */}
        <div className="p-6 bg-white border border-neutral-200 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-3 text-indigo-600 mb-3">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-sm text-neutral-800">Hierarchical AI Workforce</h3>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Head Architect delegates to Platform (Control, Memory, Governance) and Tools teams. Every member has editable persona & domain responsibilities.
          </p>
        </div>

        <div className="p-6 bg-white border border-neutral-200 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-3 text-emerald-600 mb-3">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-sm text-neutral-800">Full Memory Persistence</h3>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            All chat histories, prompt logs, and decision contexts are stored persistently on the backend and restored seamlessly upon reload.
          </p>
        </div>
      </div>

      {/* Existing Projects Section */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            Active Projects ({projects.length})
          </h2>
          {projects.length > 0 && onDeleteAllProjects && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Projects</span>
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-600">No active projects found.</p>
            <p className="text-xs text-neutral-400 mt-1">Click "Start a New Project" above to create your agent workforce.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const agentCount = Object.keys(p.agents).length;
              const rootAgent = p.agents[p.rootAgentId];

              return (
                <div 
                  key={p.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-neutral-900 truncate">{p.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmProject(p);
                        }}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-neutral-500 mb-2 line-clamp-2">
                      {p.description || `Head Architect: ${rootAgent?.personName || 'Alice'} (${rootAgent?.roleName})`}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-mono bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 text-neutral-600 mb-6">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{agentCount} AI Team Members configured</span>
                    </div>
                  </div>

                  {/* Three Main Action Buttons: Details/Overview, Edit Team, Open Workspace */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => setOverviewProject(p)}
                      className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      title="View Project Overview & Details"
                    >
                      <Info className="w-3.5 h-3.5" /> Overview
                    </button>
                    <button
                      onClick={() => onEditProject(p)}
                      className="px-2.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Team
                    </button>
                    <button
                      onClick={() => onOpenProject(p)}
                      className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-indigo-200"
                    >
                      <Play className="w-3.5 h-3.5" /> Workspace
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Overview Modal */}
      {overviewProject && (
        <ProjectOverviewModal
          project={overviewProject}
          onClose={() => setOverviewProject(null)}
          onOpenWorkspace={onOpenProject}
          onEditTeam={onEditProject}
          onDeleteProject={(pid) => {
            onDeleteProject(pid);
            setOverviewProject(null);
          }}
          onUpdateProject={(upd) => {
            if (onUpdateProject) onUpdateProject(upd);
            setOverviewProject(upd);
          }}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Project?</h3>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-neutral-800">"{deleteConfirmProject.name}"</span>? All team agent chat logs, configurations, and decisions will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmProject(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProject(deleteConfirmProject.id);
                  setDeleteConfirmProject(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Projects Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete All Projects?</h3>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              This will permanently delete all <span className="font-bold text-neutral-800">{projects.length} project(s)</span>, chat histories, agent nodes, and disk/memory storage. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteAllProjects) onDeleteAllProjects();
                  setShowDeleteAllConfirm(false);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Clear All Projects Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold mb-1">Create New Project</h3>
            <p className="text-xs text-neutral-500 mb-6">Set your project name and select an agent team template.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  placeholder="e.g., AI Developer Ecosystem"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                  Team Structure
                </label>
                <div className="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/50 flex items-start gap-3 mb-4">
                  <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-neutral-900">Custom Organization & Team</p>
                    <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                      Start with Head Architect and build your custom team hierarchy or paste your team JSON below.
                    </p>
                  </div>
                </div>

                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-600" />
                  Paste Team JSON (Optional)
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setJsonError('');
                  }}
                  placeholder="Paste project JSON structure here to import your team hierarchy..."
                  rows={4}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-mono outline-none focus:border-indigo-500 focus:bg-white transition-all resize-y"
                />
                {jsonError && <p className="text-xs text-red-500 mt-1 font-medium">{jsonError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-200"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
