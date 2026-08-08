import React, { useState } from 'react';
import { Project, AgentNode } from '../types';
import { 
  X, User, Users, Play, Edit3, Trash2, Check, FileText, 
  Sparkles, Shield, Cpu, Terminal, Calendar, MessageSquare, Info
} from 'lucide-react';
import { cn } from '../utils';

interface ProjectOverviewModalProps {
  project: Project;
  onClose: () => void;
  onOpenWorkspace: (project: Project, agentId?: string) => void;
  onEditTeam: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject?: (updatedProject: Project) => void;
}

export function ProjectOverviewModal({
  project,
  onClose,
  onOpenWorkspace,
  onEditTeam,
  onDeleteProject,
  onUpdateProject
}: ProjectOverviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(project.name);
  const [descInput, setDescInput] = useState(project.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const rootAgent = project.agents[project.rootAgentId];
  const allAgents = Object.values(project.agents);

  const handleSaveOverview = () => {
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        name: nameInput.trim() || project.name,
        description: descInput.trim()
      });
    }
    setIsEditing(false);
  };

  const getAgentIcon = (roleName: string) => {
    const lower = roleName.toLowerCase();
    if (lower.includes('architect') || lower.includes('head') || lower.includes('supervisor')) {
      return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
    if (lower.includes('platform') || lower.includes('control')) {
      return <Cpu className="w-4 h-4 text-blue-600" />;
    }
    if (lower.includes('memory') || lower.includes('state')) {
      return <FileText className="w-4 h-4 text-emerald-600" />;
    }
    if (lower.includes('governance') || lower.includes('policy')) {
      return <Shield className="w-4 h-4 text-purple-600" />;
    }
    return <Terminal className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-700 p-3 rounded-2xl">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Project Details & Overview
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">ID: {project.id.slice(0, 8)}</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-neutral-900 mt-1">
                {project.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
          {/* Editable Name & Description Block */}
          <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Project Information
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Info
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOverview}
                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Project Overview / Description
                  </label>
                  <textarea
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    rows={3}
                    placeholder="Describe the main purpose and target goals of this project..."
                    className="w-full bg-white border border-neutral-300 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-neutral-700 leading-relaxed font-medium mb-3">
                  {project.description || 'No project description provided yet.'}
                </p>
                <div className="flex items-center gap-4 text-xs text-neutral-500 border-t border-neutral-200/60 pt-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    Total AI Workforce: {allAgents.length} Agents
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Core Architectural Goal / Root Agent Context */}
          {rootAgent && (
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Head Architect Context ({rootAgent.personName})
                </h4>
              </div>
              <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-3">
                {rootAgent.responsibilities}
              </p>
              {rootAgent.decisions && (
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                    Formalized Goal & Architecture Strategy
                  </span>
                  <p className="text-xs text-white leading-relaxed font-mono">
                    {rootAgent.decisions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AI Workforce Roster */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center justify-between">
              <span>Configured AI Team Members ({allAgents.length})</span>
              <span className="text-[10px] text-neutral-400 font-normal">Click any agent to open chat</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allAgents.map((agent) => {
                const messageCount = agent.chatHistory.length;
                return (
                  <div
                    key={agent.id}
                    onClick={() => {
                      onClose();
                      onOpenWorkspace(project, agent.id);
                    }}
                    className="p-4 bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-2xl cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-neutral-100 group-hover:bg-indigo-50 rounded-lg transition-colors">
                            {getAgentIcon(agent.roleName)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                              {agent.personName}
                            </h4>
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                              {agent.roleName}
                            </p>
                          </div>
                        </div>

                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          agent.status === 'drafting' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          agent.status === 'awaiting_review' ? "bg-purple-50 text-purple-700 border-purple-200" :
                          agent.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          agent.status === 'delegated' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-neutral-100 text-neutral-600 border-neutral-200"
                        )}>
                          {agent.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-3">
                        {agent.responsibilities}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-indigo-500" />
                        {messageCount} Messages
                      </span>
                      <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                        Chat &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Project
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => {
                onClose();
                onEditTeam(project);
              }}
              className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Team Structure
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenWorkspace(project);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200"
            >
              <Play className="w-3.5 h-3.5" /> Open Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Project?</h3>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-neutral-800">"{project.name}"</span>? All 8 agent personas, chat histories, prompt logs, and formalized architectural decisions will be permanently erased.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onClose();
                  onDeleteProject(project.id);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
