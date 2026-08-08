import React, { useState } from 'react';
import { Project, AgentNode, AgentStatus } from '../types';
import { 
  Users, Search, Sparkles, MessageSquare, FileText, ChevronRight, 
  ArrowLeft, ShieldCheck, GitCompare, BookOpen, Layers, CheckCircle2,
  FolderPlus, Clock, Cpu, CornerDownRight
} from 'lucide-react';
import { cn } from '../utils';

interface AllAgentsDirectoryViewProps {
  project: Project;
  onSelectAgent: (agentId: string) => void;
  onBuildArchitecture: (agentId: string) => void;
  onBack: () => void;
  onEditTeam?: () => void;
  isBuildingMap?: Record<string, boolean>;
}

export function AllAgentsDirectoryView({
  project,
  onSelectAgent,
  onBuildArchitecture,
  onBack,
  onEditTeam,
  isBuildingMap = {}
}: AllAgentsDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const agentsList = Object.values(project.agents || {});

  const filteredAgents = agentsList.filter(agent => {
    const matchesSearch = 
      agent.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.responsibilities.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'idle': return <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>Idle</span>;
      case 'drafting': return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>Drafting Spec</span>;
      case 'delegated': return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Delegated Down</span>;
      case 'awaiting_review': return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Awaiting Review</span>;
      case 'approved': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Approved / Merged</span>;
      default: return null;
    }
  };

  const totalDocs = agentsList.reduce((acc, a) => acc + (a.documents?.length || 5), 0);
  const totalPending = Object.values(project.pendingApprovals || {}).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 overflow-y-auto">
      
      {/* Top Banner Header */}
      <header className="bg-white border-b border-neutral-200 p-6 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-500 transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-neutral-900">{project.name}</h1>
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                  Multi-Agent Roster
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Overview of all {agentsList.length} autonomous agent nodes, domain specs, and memory banks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditTeam && (
              <button
                onClick={onEditTeam}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Users className="w-4 h-4 text-neutral-500" /> Edit Hierarchy Tree
              </button>
            )}
            <button
              onClick={() => onSelectAgent(project.rootAgentId)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs shadow-indigo-200 flex items-center gap-1.5"
            >
              <Cpu className="w-4 h-4" /> Head Architect Workspace
            </button>
          </div>
        </div>

        {/* System Stats Bar */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Agents</p>
              <p className="text-sm font-extrabold text-neutral-900">{agentsList.length} Nodes</p>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Approved Specs</p>
              <p className="text-sm font-extrabold text-neutral-900">
                {agentsList.filter(a => a.status === 'approved' || a.status === 'delegated').length} Slices
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Pending Diffs</p>
              <p className="text-sm font-extrabold text-neutral-900">{totalPending} Submissions</p>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Doc Repositories</p>
              <p className="text-sm font-extrabold text-neutral-900">{totalDocs} Markdown Files</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter agents by name, role title, or domain scope..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">Status:</span>
            {['all', 'idle', 'drafting', 'delegated', 'awaiting_review', 'approved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0",
                  statusFilter === st 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                )}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="max-w-7xl mx-auto w-full p-6">
        {filteredAgents.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400">
            <Users className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            <p className="font-bold text-neutral-700 text-base">No Agents Found</p>
            <p className="text-xs text-neutral-400 mt-1">Try adjusting your search filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map((agent) => {
              const parentAgent = agent.parentId ? project.agents[agent.parentId] : null;
              const isRoot = agent.id === project.rootAgentId;
              const isBuilding = !!isBuildingMap[agent.id];
              const docCount = agent.documents?.length || 5;

              return (
                <div 
                  key={agent.id}
                  className="bg-white border border-neutral-200 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Agent Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs shrink-0",
                          isRoot ? "bg-indigo-600 text-white" : "bg-neutral-900 text-white"
                        )}>
                          {agent.personName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-neutral-900 truncate group-hover:text-indigo-600 transition-colors">
                            {agent.personName}
                          </h3>
                          <p className="text-xs text-neutral-500 font-medium truncate">{agent.roleName}</p>
                        </div>
                      </div>
                      {getStatusBadge(agent.status)}
                    </div>

                    {/* Hierarchy & Supervision Badges */}
                    <div className="flex items-center gap-2 mb-3 text-[10px] text-neutral-500 font-medium flex-wrap">
                      {isRoot ? (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                          👑 Root Head Architect
                        </span>
                      ) : parentAgent ? (
                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md flex items-center gap-1 truncate">
                          <CornerDownRight className="w-3 h-3 text-neutral-400" /> Reports to {parentAgent.personName}
                        </span>
                      ) : null}

                      {agent.childrenIds.length > 0 && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                          Direct Reports: {agent.childrenIds.length}
                        </span>
                      )}
                    </div>

                    {/* Responsibilities */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Domain Scope
                      </p>
                      <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed">
                        {agent.responsibilities || 'General software engineering domain scope.'}
                      </p>
                    </div>

                    {/* Memory Documents Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {docCount} Memory Docs
                      </span>
                      <span className="bg-neutral-100 text-neutral-600 text-[10px] font-medium px-2 py-0.5 rounded-md">
                        Design Principles
                      </span>
                      <span className="bg-neutral-100 text-neutral-600 text-[10px] font-medium px-2 py-0.5 rounded-md">
                        Sprint Updates
                      </span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
                    <button
                      onClick={() => onSelectAgent(agent.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Workspace
                    </button>

                    <button
                      onClick={() => onBuildArchitecture(agent.id)}
                      disabled={isBuilding}
                      className="bg-indigo-50 hover:bg-indigo-100 disabled:bg-neutral-100 text-indigo-700 py-2 px-3 rounded-xl text-xs font-semibold transition-colors border border-indigo-200/60 flex items-center justify-center gap-1.5 shrink-0"
                      title="Generate Domain Technical Architecture"
                    >
                      <Sparkles className={cn("w-3.5 h-3.5 text-indigo-600", isBuilding && "animate-spin")} />
                      {isBuilding ? 'Drafting...' : 'Build Arch'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
