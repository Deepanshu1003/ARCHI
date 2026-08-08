import React, { useState, useEffect, useRef } from 'react';
import { Project, AgentNode, ChatMessage, AgentStatus, PendingApproval, AgentDoc } from '../types';
import { 
  ArrowLeft, User, Send, ChevronRight, MessageSquare, 
  PanelLeftClose, PanelLeftOpen, 
  Edit2, Check, Sparkles, CornerDownRight, FileText, Info,
  GitCompare, ShieldCheck, Eye, Code, AlertTriangle, Plus, Trash2, 
  Download, Copy, Users, BookOpen, Layers, Calendar, ListTodo, 
  CheckCircle2, Clock, Grid, GitBranch, Cpu, GitPullRequest
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../utils';
import { ProjectOverviewModal } from './ProjectOverviewModal';
import { DiffModal } from './DiffModal';
import { AllAgentsDirectoryView } from './AllAgentsDirectoryView';
import { SprintPlanningWorkspace } from './SprintPlanningWorkspace';
import { CreateSprintFromArchitectureModal } from './CreateSprintFromArchitectureModal';
import { AgentCodingToolsModal } from './AgentCodingToolsModal';
import { CodeRepositoryWorkspace } from './CodeRepositoryWorkspace';
import { createAgentDefaultDocs } from '../utils/defaultProject';
import * as api from '../api';

interface DashboardViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (p: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onEditTeam?: () => void;
}

interface LocalSprintTask {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Todo' | 'In Progress' | 'Done';
}

export function DashboardView({ project, onBack, onUpdateProject, onDeleteProject, onEditTeam }: DashboardViewProps) {
  // Navigation View Mode: 'all_agents' vs 'workspace' vs 'sprint_planning' vs 'code_repository'
  const [viewMode, setViewMode] = useState<'all_agents' | 'workspace' | 'sprint_planning' | 'code_repository'>('all_agents');

  // Selected Active Agent
  const [activeAgentId, setActiveAgentId] = useState<string>(project.rootAgentId);

  // Chat & UI States
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showCreateSprintFromArchModal, setShowCreateSprintFromArchModal] = useState(false);
  const [showAgentCodingToolsModal, setShowAgentCodingToolsModal] = useState(false);

  // Active Document Tab ID inside Workspace ('arch', 'design', 'procedural', 'episodic', 'sprint', or custom doc id)
  const [activeDocCategory, setActiveDocCategory] = useState<string>('plan');

  // Workbench view mode: 'preview' (react-markdown) vs 'edit' (raw textarea)
  const [workbenchTab, setWorkbenchTab] = useState<'preview' | 'edit'>('preview');

  // Async Action Loading States
  const [buildingAgentsMap, setBuildingAgentsMap] = useState<Record<string, boolean>>({});
  const [isFinalizingArch, setIsFinalizingArch] = useState(false);
  const [isPublishingSlice, setIsPublishingSlice] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Diff Review Modal State
  const [selectedPendingApproval, setSelectedPendingApproval] = useState<PendingApproval | null>(null);

  // Inline editing for agent details
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [editPersonName, setEditPersonName] = useState('');
  const [editRoleName, setEditRoleName] = useState('');
  const [editResponsibilities, setEditResponsibilities] = useState('');

  // Interactive Sprint Manager State
  const [sprintTasks, setSprintTasks] = useState<LocalSprintTask[]>([
    { id: 't1', title: 'Define domain boundaries & clean architecture ports', priority: 'High', status: 'Done' },
    { id: 't2', title: 'Draft technical specification & REST schemas', priority: 'High', status: 'In Progress' },
    { id: 't3', title: 'Complete peer review & supervisor approval', priority: 'Medium', status: 'Todo' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeAgent = project.agents[activeAgentId];
  const isHeadArchitect = activeAgentId === project.rootAgentId;

  // Every agent owns exactly two slots; empty placeholders until the server fills them
  const getAgentDocs = (agent: AgentNode): AgentDoc[] => {
    if (agent.documents && agent.documents.length > 0) {
      return agent.documents;
    }
    return createAgentDefaultDocs(agent.id);
  };

  // Sync edit state when active agent changes
  useEffect(() => {
    if (activeAgent) {
      setEditPersonName(activeAgent.personName);
      setEditRoleName(activeAgent.roleName);
      setEditResponsibilities(activeAgent.responsibilities);
      setIsEditingAgent(false);
      setApiError(null);
    }
  }, [activeAgentId, activeAgent]);

  // Auto-scroll chat terminal
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeAgent?.chatHistory, isTyping]);

  const updateAgent = (id: string, updates: Partial<AgentNode>) => {
    const updatedAgents = {
      ...project.agents,
      [id]: { ...project.agents[id], ...updates }
    };
    onUpdateProject({
      ...project,
      agents: updatedAgents
    });
  };

  const handleSaveAgentEdits = () => {
    if (!activeAgent) return;
    updateAgent(activeAgent.id, {
      personName: editPersonName.trim() || activeAgent.personName,
      roleName: editRoleName.trim() || activeAgent.roleName,
      responsibilities: editResponsibilities.trim() || activeAgent.responsibilities
    });
    setIsEditingAgent(false);
  };

  // Update a document in active agent's memory bank
  const handleUpdateActiveDocContent = (newContent: string) => {
    if (!activeAgent) return;
    const docs = getAgentDocs(activeAgent);
    const updatedDocs = docs.map(d => {
      if (d.id === activeDocCategory) {
        const currentVer = d.version || 1;
        const nextVer = currentVer + 1;
        const prevVersions = d.versions || [{ version: 1, content: d.content, updatedAt: d.updatedAt, author: activeAgent.personName }];
        return {
          ...d,
          content: newContent,
          updatedAt: Date.now(),
          version: nextVer,
          versions: [...prevVersions, { version: nextVer, content: newContent, updatedAt: Date.now(), author: activeAgent.personName }]
        };
      }
      return d;
    });

    // If active document is the architecture spec, also sync agent.decisions
    const planDoc = updatedDocs.find(d => d.docType === 'plan' || d.id === 'plan');
    const decisionsVal = planDoc ? planDoc.content : newContent;

    updateAgent(activeAgent.id, {
      documents: updatedDocs,
      decisions: decisionsVal
    });
  };

  /**
   * Pulls the server's authoritative project state. Sprints, the code
   * repository and genesis documents are UI-only concepts the backend does not
   * own, so they are carried across untouched.
   */
  const syncFromServer = async () => {
    const fresh = await api.getProject(project.id);
    onUpdateProject({
      ...fresh,
      genesisDocuments: project.genesisDocuments,
      sprints: project.sprints,
      repository: project.repository
    });
    return fresh;
  };

  const noteDegraded = (info?: { degraded: boolean; reason: string; provider: string }) => {
    if (!info?.degraded) return;
    setApiError(`Degraded output from '${info.provider}': ${info.reason}`);
  };

  const failWith = (err: unknown, fallback: string) => {
    setApiError(err instanceof Error ? err.message : fallback);
  };

  // Chat message handler — the server parses [DOC_UPDATE: ...] tags and writes docs
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeAgent || isTyping) return;

    const currentInput = inputText;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: Date.now()
    };
    updateAgent(activeAgent.id, { chatHistory: [...activeAgent.chatHistory, userMessage] });
    setInputText('');
    setIsTyping(true);
    setApiError(null);

    try {
      const res = await api.sendChatMessage(project.id, activeAgent, currentInput);
      await syncFromServer();
      noteDegraded(res.degradedInfo);
    } catch (err) {
      failWith(err, 'Failed to send message.');
    } finally {
      setIsTyping(false);
    }
  };

  // Draft this agent's architecture slice
  const handleBuildArchitectureForAgent = async (targetAgentId: string) => {
    const targetAgentNode = project.agents[targetAgentId];
    if (!targetAgentNode) return;

    setBuildingAgentsMap(prev => ({ ...prev, [targetAgentId]: true }));
    setApiError(null);

    try {
      const res = await api.draftArchitecture(
        project.id,
        targetAgentId,
        targetAgentNode.responsibilities
      );
      await syncFromServer();
      if (res.governanceViolations.length > 0) {
        setApiError(`Governance flagged the draft: ${res.governanceViolations.join('; ')}`);
      } else {
        noteDegraded(res.degradedInfo);
      }
      setActiveDocCategory('plan');
      setWorkbenchTab('preview');
    } catch (err) {
      failWith(err, 'Failed to generate architecture.');
    } finally {
      setBuildingAgentsMap(prev => ({ ...prev, [targetAgentId]: false }));
    }
  };

  // Supervisor: hand tailored sub-plans to direct reports via the Planner agent
  const handleFinalizeArchitecture = async () => {
    if (!activeAgent) return;
    setIsFinalizingArch(true);
    setApiError(null);

    try {
      const res = await api.delegate(project.id, activeAgent.id);
      await syncFromServer();
      noteDegraded(res.degradedInfo);
    } catch (err) {
      failWith(err, 'Failed to finalize and delegate.');
    } finally {
      setIsFinalizingArch(false);
    }
  };

  // Subordinate: submit the current slice upward for review
  const handlePublishSlice = async () => {
    if (!activeAgent) return;
    setIsPublishingSlice(true);
    setApiError(null);

    try {
      await api.submitForReview(project.id, activeAgent.id, activeAgent.decisions);
      await syncFromServer();
    } catch (err) {
      failWith(err, 'Failed to publish domain specification.');
    } finally {
      setIsPublishingSlice(false);
    }
  };

  // Supervisor: approve a subordinate slice — the Merger agent folds it into the parent plan
  const handleApproveSlice = async (subordinateId: string) => {
    if (!activeAgent) return;
    setIsApproving(true);
    setApiError(null);

    try {
      const res = await api.approve(project.id, activeAgent.id, subordinateId);
      await syncFromServer();
      if (res.conflicts.length > 0) {
        setApiError(`Merged with conflicts: ${res.conflicts.join('; ')}`);
      }
      setSelectedPendingApproval(null);
    } catch (err) {
      failWith(err, 'Failed to approve slice.');
    } finally {
      setIsApproving(false);
    }
  };

  // Upload a .md/.txt file into one of the agent's two document slots
  const handleUploadDocument = async (file: File) => {
    if (!activeAgent) return;
    const docType = activeDocCategory === 'principles' ? 'principles' : 'plan';
    setApiError(null);
    try {
      await api.uploadDocument(project.id, activeAgent.id, docType, file);
      await syncFromServer();
    } catch (err) {
      failWith(err, 'Failed to upload document.');
    }
  };

  // Helper function to copy active document markdown
  const handleCopyMarkdown = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Helper function to download active document markdown
  const handleDownloadMarkdown = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'document.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sprint Manager: Add Task
  const handleAddSprintTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: LocalSprintTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      priority: 'High',
      status: 'Todo'
    };
    setSprintTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
  };

  // Sprint Manager: Toggle Task Status
  const handleToggleSprintTaskStatus = (taskId: string) => {
    setSprintTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Todo' ? 'In Progress' : t.status === 'In Progress' ? 'Done' : 'Todo';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Sprint Manager: Log AI Sprint Update directly into sprint_planning.md & Chat History
  const handleLogAISprintUpdate = () => {
    if (!activeAgent) return;
    const doneTasks = sprintTasks.filter(t => t.status === 'Done');
    const inProgressTasks = sprintTasks.filter(t => t.status === 'In Progress');
    const todoTasks = sprintTasks.filter(t => t.status === 'Todo');

    const updateBlock = `\n\n### 🚀 Sprint Update Log [${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}]\n` +
      `**Status Overview**: ${doneTasks.length}/${sprintTasks.length} Deliverables Completed\n\n` +
      `#### ✅ Completed Tasks\n` +
      (doneTasks.length > 0 ? doneTasks.map(t => `- ${t.title}`).join('\n') : '- No tasks marked complete yet.') + '\n\n' +
      `#### 🏃 Active In Progress\n` +
      (inProgressTasks.length > 0 ? inProgressTasks.map(t => `- ${t.title}`).join('\n') : '- None.') + '\n\n' +
      `#### 📋 Upcoming Backlog\n` +
      (todoTasks.length > 0 ? todoTasks.map(t => `- ${t.title}`).join('\n') : '- Backlog clear.');

    const docs = getAgentDocs(activeAgent);
    const sprintDoc = docs.find(d => d.id === 'sprint' || d.category === 'sprint_planning');
    const updatedContent = (sprintDoc ? sprintDoc.content : '') + updateBlock;

    const updatedDocs = docs.map(d => (d.id === 'sprint' || d.category === 'sprint_planning') ? { ...d, content: updatedContent, updatedAt: Date.now() } : d);

    updateAgent(activeAgent.id, {
      documents: updatedDocs,
      chatHistory: [
        ...activeAgent.chatHistory,
        {
          id: Date.now().toString(),
          role: 'agent',
          content: `📊 **[Sprint Progress Update Recorded]**:\n${updateBlock}`,
          timestamp: Date.now()
        }
      ]
    });
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'idle': return 'bg-neutral-300 text-neutral-600';
      case 'drafting': return 'bg-indigo-500 text-white';
      case 'delegated': return 'bg-amber-500 text-white';
      case 'awaiting_review': return 'bg-purple-500 text-white';
      case 'approved': return 'bg-emerald-500 text-white';
      default: return 'bg-neutral-300';
    }
  };

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'idle': return <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Idle</span>;
      case 'drafting': return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Drafting Spec</span>;
      case 'delegated': return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Delegated Down</span>;
      case 'awaiting_review': return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Awaiting Review</span>;
      case 'approved': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Approved / Merged</span>;
      default: return null;
    }
  };

  const renderSidebarNode = (agentId: string, level: number = 0) => {
    const agent = project.agents[agentId];
    if (!agent) return null;

    const isSelected = activeAgentId === agent.id;
    const pendingList = project.pendingApprovals?.[agent.id] || [];

    return (
      <div key={agent.id} className="w-full">
        <button
          onClick={() => {
            setActiveAgentId(agent.id);
            if (viewMode === 'all_agents') setViewMode('workspace');
          }}
          className={cn(
            "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all mb-1 relative",
            isSelected && viewMode === 'workspace' 
              ? "bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium shadow-xs" 
              : "hover:bg-neutral-100 text-neutral-700"
          )}
          style={{ paddingLeft: `${level * 1 + 0.75}rem` }}
        >
          <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 shadow-xs", getStatusColor(agent.status))} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold truncate">{agent.personName}</p>
              {pendingList.length > 0 && (
                <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                  {pendingList.length}
                </span>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 truncate">{agent.roleName}</p>
          </div>
          {isSelected && viewMode === 'workspace' && <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
        </button>
        {agent.childrenIds.map(childId => renderSidebarNode(childId, level + 1))}
      </div>
    );
  };

  const renderTopNavBar = () => (
    <div className="bg-neutral-900 text-white px-6 py-2.5 flex items-center justify-between shrink-0 border-b border-neutral-800 z-30">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white mr-1" title="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-xs font-display tracking-wide truncate max-w-xs">{project.name}</span>
      </div>

      <div className="flex items-center gap-1.5 bg-neutral-800 p-1 rounded-xl border border-neutral-700">
        <button
          onClick={() => setViewMode('all_agents')}
          className={cn(
            "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
            viewMode === 'all_agents' ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-400 hover:text-white"
          )}
        >
          <Grid className="w-3.5 h-3.5" /> All Agents View ({Object.keys(project.agents || {}).length})
        </button>

        <button
          onClick={() => setViewMode('workspace')}
          className={cn(
            "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
            viewMode === 'workspace' ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-400 hover:text-white"
          )}
        >
          <User className="w-3.5 h-3.5" /> Agent Workspace ({activeAgent?.personName || 'Selected'})
        </button>

        <button
          onClick={() => setViewMode('sprint_planning')}
          className={cn(
            "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
            viewMode === 'sprint_planning' ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-400 hover:text-white"
          )}
        >
          <ListTodo className="w-3.5 h-3.5" /> Sprint Workspace
        </button>

        <button
          onClick={() => setViewMode('code_repository')}
          className={cn(
            "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
            viewMode === 'code_repository' ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-400 hover:text-white"
          )}
        >
          <GitBranch className="w-3.5 h-3.5" /> Code Repo & Merges
        </button>
      </div>
    </div>
  );

  // If view mode is 'all_agents', render the complete Multi-Agent Roster directory view
  if (viewMode === 'all_agents') {
    return (
      <div className="flex h-screen overflow-hidden bg-neutral-50 font-sans flex-col">
        {renderTopNavBar()}

        <AllAgentsDirectoryView
          project={project}
          onSelectAgent={(id) => {
            setActiveAgentId(id);
            setViewMode('workspace');
          }}
          onBuildArchitecture={handleBuildArchitectureForAgent}
          onBack={onBack}
          onEditTeam={onEditTeam}
          isBuildingMap={buildingAgentsMap}
        />
      </div>
    );
  }

  if (viewMode === 'sprint_planning') {
    return (
      <div className="flex h-screen overflow-hidden bg-neutral-50 font-sans flex-col">
        {renderTopNavBar()}

        <SprintPlanningWorkspace
          project={project}
          onUpdateProject={onUpdateProject}
          onBackToWorkspace={() => setViewMode('workspace')}
        />
      </div>
    );
  }

  if (viewMode === 'code_repository') {
    return (
      <div className="flex h-screen overflow-hidden bg-neutral-50 font-sans flex-col">
        {renderTopNavBar()}

        <CodeRepositoryWorkspace
          project={project}
          onUpdateProject={onUpdateProject}
          onBackToWorkspace={() => setViewMode('workspace')}
        />
      </div>
    );
  }

  // Active document and docs list for selected agent
  const currentAgentDocs = activeAgent ? getAgentDocs(activeAgent) : [];
  const activeDoc = currentAgentDocs.find(d => d.id === activeDocCategory) || currentAgentDocs[0];
  const currentPendingApprovals = project.pendingApprovals?.[activeAgentId] || [];
  const isBuildingActiveAgentArch = !!buildingAgentsMap[activeAgentId];

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 font-sans flex-col">
      
      {/* Top Navigation Bar: Toggle View Modes */}
      {renderTopNavBar()}

      <div className="flex flex-1 overflow-hidden">
        {/* ================= LEFT PANEL: HIERARCHY TREE & AGENT CHAT ================= */}
        <aside className={cn(
          "bg-white border-r border-neutral-200 flex flex-col shrink-0 transition-all duration-300 z-20 relative",
          isLeftPanelOpen ? "w-80 sm:w-96" : "w-14"
        )}>
          {/* Top Header */}
          <div className="p-3 border-b border-neutral-100 flex items-center justify-between h-14 shrink-0 bg-neutral-50/50">
            {isLeftPanelOpen ? (
              <>
                <button 
                  onClick={() => setViewMode('all_agents')} 
                  className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 rounded-xl text-xs font-bold transition-all border border-neutral-200 flex items-center gap-1.5 shadow-xs"
                  title="Back to All Agents View"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                  <span>All Agents</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {Object.keys(project.agents || {}).length} Members
                  </span>
                  <button 
                    onClick={() => setIsLeftPanelOpen(false)} 
                    className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors"
                    title="Collapse Team Panel"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => setIsLeftPanelOpen(true)} 
                className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl mx-auto transition-colors"
                title="Expand Team Panel"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Chat Panel & Quick Agent Selector (Hierarchy Tree block removed as requested) */}
          {isLeftPanelOpen ? (
            <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 divide-y divide-neutral-200/80">
              {/* Quick Agent Selector Bar */}
              <div className="p-3 bg-white flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {activeAgent?.personName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate">{activeAgent?.personName}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{activeAgent?.roleName}</p>
                  </div>
                </div>

                <select
                  value={activeAgentId}
                  onChange={(e) => setActiveAgentId(e.target.value)}
                  className="text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1 outline-none focus:border-indigo-500 max-w-[130px] truncate shadow-xs"
                  title="Switch Active Agent"
                >
                  {Object.values(project.agents).map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.personName} ({agent.roleName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Chat Terminal with Active Agent */}
              <div className="flex-1 flex flex-col min-h-0 bg-neutral-50">
                {activeAgent ? (
                  <>
                    <div className="bg-white px-3 py-2 border-b border-neutral-200/80 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Interactive Terminal</span>
                      </div>
                      {getStatusBadge(activeAgent.status)}
                    </div>

                    {/* Chat Messages Log */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {activeAgent.chatHistory.length === 0 ? (
                        <div className="text-center text-neutral-400 py-8 px-4">
                          <MessageSquare className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
                          <p className="text-xs font-bold text-neutral-700">Refine Architectural Spec</p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">Instruct {activeAgent.personName} on implementation details.</p>
                        </div>
                      ) : (
                        activeAgent.chatHistory.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={cn(
                              "flex gap-2 max-w-[90%]", 
                              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                              msg.role === 'user' ? "bg-neutral-900 text-white" : "bg-indigo-600 text-white"
                            )}>
                              {msg.role === 'user' ? 'U' : activeAgent.personName.charAt(0)}
                            </div>
                            <div className={cn(
                              "p-2.5 rounded-xl text-xs leading-relaxed shadow-xs",
                              msg.role === 'user' 
                                ? "bg-indigo-600 text-white rounded-tr-xs" 
                                : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-xs"
                            )}>
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}
                      {isTyping && (
                        <div className="flex gap-2 max-w-[90%] mr-auto">
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {activeAgent.personName.charAt(0)}
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-400 text-xs shadow-xs flex items-center gap-1">
                            <span>Agent is typing...</span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-2.5 bg-white border-t border-neutral-200 shrink-0">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={`Instruct ${activeAgent.personName}...`}
                          className="w-full bg-neutral-100 border border-neutral-200 rounded-full pl-3.5 pr-10 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        />
                        <button 
                          onClick={handleSendMessage}
                          disabled={!inputText.trim() || isTyping}
                          className="absolute right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white rounded-full transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 flex flex-col items-center gap-2 pt-4">
              {Object.values(project.agents).map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setActiveAgentId(agent.id)}
                  title={`${agent.personName} (${agent.roleName})`}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative",
                    activeAgentId === agent.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  {agent.personName.charAt(0)}
                  <span className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white", getStatusColor(agent.status))} />
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ================= RIGHT PANEL: WORKBENCH, DOCS & SPRINT MANAGER ================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-neutral-50 relative overflow-hidden">
          {activeAgent ? (
            <>
              {/* Header Bar: Primary Agent Info & Actions */}
              <header className="bg-white border-b border-neutral-200/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs z-10">
                <div className="flex items-center gap-3.5 min-w-0">
                  <button 
                    onClick={() => setViewMode('all_agents')} 
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 rounded-xl text-xs font-bold transition-colors border border-neutral-200/80 flex items-center gap-1.5 shrink-0"
                    title="Back to All Agents Overview"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                    <span>All Agents</span>
                  </button>

                  {!isLeftPanelOpen && (
                    <button onClick={() => setIsLeftPanelOpen(true)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 mr-1" title="Show Team Sidebar">
                      <PanelLeftOpen className="w-4 h-4" />
                    </button>
                  )}

                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0 font-bold text-sm">
                    {activeAgent.personName.charAt(0)}
                  </div>

                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-neutral-900 truncate tracking-tight">{activeAgent.personName}</h2>
                      {getStatusBadge(activeAgent.status)}
                      <button 
                        onClick={() => setIsEditingAgent(!isEditingAgent)}
                        className="p-1 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-md transition-colors"
                        title="Edit Persona Info"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-neutral-500 font-medium truncate">{activeAgent.roleName}</span>
                  </div>
                </div>

                {/* Dynamic Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* BUILD ARCHITECTURE */}
                  <button
                    onClick={() => handleBuildArchitectureForAgent(activeAgent.id)}
                    disabled={isBuildingActiveAgentArch}
                    className="bg-indigo-50 hover:bg-indigo-100/80 disabled:bg-neutral-100 text-indigo-700 disabled:text-neutral-400 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-indigo-200/60 shadow-2xs"
                    title="Generate Domain Architecture for this agent persona"
                  >
                    <Sparkles className={cn("w-3.5 h-3.5 text-indigo-600", isBuildingActiveAgentArch && "animate-spin")} />
                    <span>{isBuildingActiveAgentArch ? 'Drafting...' : 'Build Architecture'}</span>
                  </button>

                  {/* CREATE SPRINT FROM ARCHITECTURE */}
                  <button
                    onClick={() => setShowCreateSprintFromArchModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                    title="Create Sprint Plan from Architecture and assign tasks to direct reportees or self"
                  >
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>Create Sprint</span>
                  </button>

                  {/* AI CODING TOOLS & SUB-AGENTS */}
                  <button
                    onClick={() => setShowAgentCodingToolsModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                    title="Open AI Coding Tools, Unit Test Generator & PR Submitter"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>AI Coding Tools</span>
                  </button>

                  {/* HEAD ARCHITECT SPECIFIC DELEGATION */}
                  {isHeadArchitect && (
                    <button
                      onClick={handleFinalizeArchitecture}
                      disabled={isFinalizingArch || !activeAgent.decisions}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className={cn("w-3.5 h-3.5", isFinalizingArch && "animate-spin")} />
                      <span>{isFinalizingArch ? 'Delegating...' : 'Finalize & Delegate'}</span>
                    </button>
                  )}

                  {/* LEADS & SPECIALISTS: PUBLISH DOMAIN SPEC */}
                  {!isHeadArchitect && (
                    <button
                      onClick={handlePublishSlice}
                      disabled={isPublishingSlice || !activeAgent.decisions}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className={cn("w-3.5 h-3.5", isPublishingSlice && "animate-spin")} />
                      <span>{isPublishingSlice ? 'Publishing...' : 'Publish Domain Spec'}</span>
                    </button>
                  )}

                  {/* SUPERVISOR REVIEW MODE: PENDING SUBORDINATE DIFFS */}
                  {currentPendingApprovals.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-purple-50 p-1 rounded-xl border border-purple-200/80">
                      <span className="text-[11px] font-bold text-purple-700 px-2 flex items-center gap-1">
                        <GitCompare className="w-3.5 h-3.5" /> {currentPendingApprovals.length} Pending
                      </span>
                      {currentPendingApprovals.map(approval => {
                        const subAgent = project.agents[approval.authorId];
                        return (
                          <button
                            key={approval.authorId}
                            onClick={() => setSelectedPendingApproval(approval)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Diff: {subAgent?.personName || approval.authorId}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => setShowOverviewModal(true)}
                    className="p-2 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 rounded-xl transition-colors border border-neutral-200/60"
                    title="Project Overview & Roster"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* Error Banner if API error occurs */}
              {apiError && (
                <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between text-xs text-red-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                  <button onClick={() => setApiError(null)} className="font-bold underline text-red-800 hover:text-red-950">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Inline Agent Edit Box */}
              {isEditingAgent && (
                <div className="bg-indigo-50/60 border-b border-indigo-100 px-6 py-3.5 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-150 shrink-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">Person Name (Persona)</label>
                      <input 
                        type="text" 
                        value={editPersonName}
                        onChange={(e) => setEditPersonName(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">Role Title</label>
                      <input 
                        type="text" 
                        value={editRoleName}
                        onChange={(e) => setEditRoleName(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 shadow-2xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">Domain Responsibilities</label>
                    <textarea 
                      value={editResponsibilities}
                      onChange={(e) => setEditResponsibilities(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500 resize-none shadow-2xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsEditingAgent(false)}
                      className="px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/50 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveAgentEdits}
                      className="px-4 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Check className="w-3 h-3" /> Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Memory Bank & Document Navigation Bar */}
              <div className="bg-neutral-100/70 border-b border-neutral-200 px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto py-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200/80 rounded-xl shrink-0 shadow-2xs">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-neutral-800 truncate">
                      {activeAgent.personName}'s Memory
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 font-bold text-[10px] px-1.5 py-0.2 rounded-full border border-indigo-100">
                      {currentAgentDocs.length}
                    </span>
                  </div>
                  
                  {currentAgentDocs
                    .filter(doc => !doc.isArchived)
                    .map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDocCategory(doc.id)}
                      className={cn(
                        "px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 border relative",
                        doc.isQuarantined 
                          ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                          : activeDocCategory === doc.id 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold" 
                            : "bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-700 shadow-2xs"
                      )}
                    >
                      {doc.isQuarantined ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span>{doc.title}</span>
                      <span className={cn(
                        "text-[10px] px-1 py-0.2 rounded-full font-mono",
                        activeDocCategory === doc.id && !doc.isQuarantined
                          ? "bg-indigo-700 text-indigo-100"
                          : "bg-neutral-100 text-neutral-600"
                      )}>
                        v{doc.version || 1}
                      </span>
                    </button>
                  ))}

                  <label
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-neutral-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 border border-dashed border-neutral-300 shrink-0 cursor-pointer"
                    title={`Upload a .md or .txt file into the '${activeDocCategory}' slot`}
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".md,.txt"
                      className="hidden"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) handleUploadDocument(file);
                      }}
                    />
                  </label>
                </div>

                {/* Right side controls: Copy, Download, Delete, Raw Edit vs Preview */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeDoc && (
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-neutral-200/80 shadow-2xs">
                      <button
                        onClick={() => handleCopyMarkdown(activeDoc.content)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"
                        title="Copy Markdown"
                      >
                        {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDownloadMarkdown(activeDoc.filename, activeDoc.content)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"
                        title={`Download ${activeDoc.filename}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  )}

                  {/* Preview vs Raw Edit Tabs */}
                  <div className="bg-white p-0.5 rounded-xl flex items-center gap-0.5 border border-neutral-200/80 shadow-2xs">
                    <button
                      onClick={() => setWorkbenchTab('preview')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        workbenchTab === 'preview' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => setWorkbenchTab('edit')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        workbenchTab === 'edit' ? 'bg-white text-indigo-700 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" /> Raw Editor
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Workbench Canvas (Styled using focus selector container) */}
              <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
                <div className="max-w-4xl mx-auto space-y-6">

                  {/* QUARANTINED DOCUMENT WARNING BANNER */}
                  {activeDoc?.isQuarantined && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-2xs flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-700 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                          Quarantined Document Tag
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Flagged for Human Review
                          </span>
                        </h4>
                        <p className="text-xs text-amber-800 mt-1">
                          {activeDoc.quarantineReason || "This memory instruction tag failed role schema validation and was isolated rather than dropped."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SPRINT PLANNING INTERACTIVE WIDGET (when Sprint tab is active) */}
                  {(activeDoc?.category === 'sprint_planning' || activeDocCategory === 'sprint') && (
                    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-neutral-900 text-sm">Interactive Sprint Manager</h3>
                            <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                              Sprint 1 - In Progress
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">Manage tasks & sync release logs into sprint_planning.md</p>
                        </div>

                        <button
                          onClick={handleLogAISprintUpdate}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Log AI Sprint Update
                        </button>
                      </div>

                      {/* Task Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSprintTask()}
                          placeholder="Add new user story or sprint task..."
                          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                        />
                        <button
                          onClick={handleAddSprintTask}
                          disabled={!newTaskTitle.trim()}
                          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-4 h-4" /> Add Task
                        </button>
                      </div>

                      {/* Task List */}
                      <div className="space-y-2 pt-1">
                        {sprintTasks.map(task => (
                          <div 
                            key={task.id} 
                            onClick={() => handleToggleSprintTaskStatus(task.id)}
                            className="bg-neutral-50 border border-neutral-200/80 hover:border-indigo-300 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                                task.status === 'Done' ? "bg-emerald-600 border-emerald-600 text-white" : "border-neutral-300 bg-white"
                              )}>
                                {task.status === 'Done' && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className={cn(
                                "text-xs font-medium text-neutral-800",
                                task.status === 'Done' && "line-through text-neutral-400"
                              )}>
                                {task.title}
                              </span>
                            </div>

                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                              task.status === 'Done' ? "bg-emerald-100 text-emerald-800" : task.status === 'In Progress' ? "bg-indigo-100 text-indigo-800" : "bg-neutral-200 text-neutral-600"
                            )}>
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DOCUMENT CANVAS CONTAINER */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-xs min-h-[500px] flex flex-col">
                    
                    {workbenchTab === 'preview' ? (
                      /* Rich Markdown Preview Renderer */
                      <div className="prose prose-neutral max-w-none text-neutral-800 leading-relaxed text-sm">
                        {activeDoc?.content ? (
                          <Markdown>{activeDoc.content}</Markdown>
                        ) : (
                          <div className="text-center py-20 text-neutral-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                            <p className="font-bold text-base text-neutral-700">No Document Content</p>
                            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                              Switch to the <span className="font-semibold text-neutral-600">"Raw Editor"</span> tab above to add markdown notes.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Raw Specification Textarea Editor */
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                            {activeDoc?.filename || 'document.md'}
                          </label>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Last Updated: {activeDoc?.updatedAt ? new Date(activeDoc.updatedAt).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                        <textarea
                          value={activeDoc?.content || ''}
                          onChange={(e) => handleUpdateActiveDocContent(e.target.value)}
                          placeholder="# Document Header\n\nWrite markdown specification, architectural principles, or procedural logs..."
                          className="flex-1 min-h-[480px] w-full bg-neutral-900 font-mono text-xs text-neutral-100 p-5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                        />
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              Select an agent from the team structure sidebar.
            </div>
          )}
        </main>
      </div>

      {/* ================= DIFF MODAL COMPONENT ================= */}
      {selectedPendingApproval && activeAgent && (
        <DiffModal
          pendingApproval={selectedPendingApproval}
          subordinateAgent={project.agents[selectedPendingApproval.authorId]}
          supervisorAgent={activeAgent}
          onApprove={() => handleApproveSlice(selectedPendingApproval.authorId)}
          onClose={() => setSelectedPendingApproval(null)}
          isApproving={isApproving}
        />
      )}

      {/* Project Overview Modal */}
      {showOverviewModal && (
        <ProjectOverviewModal
          project={project}
          onClose={() => setShowOverviewModal(false)}
          onOpenWorkspace={(p, agentId) => {
            setShowOverviewModal(false);
            if (agentId) {
              setActiveAgentId(agentId);
              setViewMode('workspace');
            }
          }}
          onEditTeam={() => {
            setShowOverviewModal(false);
            if (onEditTeam) onEditTeam();
            else onBack();
          }}
          onDeleteProject={(pid) => {
            setShowOverviewModal(false);
            if (onDeleteProject) onDeleteProject(pid);
            else onBack();
          }}
          onUpdateProject={(upd) => {
            onUpdateProject(upd);
          }}
        />
      )}

      {/* Create Sprint From Architecture Modal */}
      {showCreateSprintFromArchModal && activeAgent && (
        <CreateSprintFromArchitectureModal
          isOpen={showCreateSprintFromArchModal}
          authorAgent={activeAgent}
          project={project}
          architectureText={activeAgent.decisions || `# Domain Architecture\n\n- Task 1: Initialize baseline interface contracts\n- Task 2: Implement core services\n- Task 3: Setup database schemas`}
          onClose={() => setShowCreateSprintFromArchModal(false)}
          onCreateSprint={(newSprint) => {
            const updatedSprints = { ...(project.sprints || {}), [newSprint.sprintId]: newSprint };
            onUpdateProject({
              ...project,
              sprints: updatedSprints
            });
            setShowCreateSprintFromArchModal(false);
            setViewMode('sprint_planning');
          }}
        />
      )}

      {/* AI Coding Tools & Sub-Agents Modal */}
      {showAgentCodingToolsModal && activeAgent && (
        <AgentCodingToolsModal
          isOpen={showAgentCodingToolsModal}
          agent={activeAgent}
          project={project}
          activeDocContent={activeDoc?.content || activeAgent.decisions || ''}
          onClose={() => setShowAgentCodingToolsModal(false)}
          onApplyCodeToDoc={(newContent) => {
            handleUpdateActiveDocContent(newContent);
            setShowAgentCodingToolsModal(false);
          }}
          onUpdateProject={onUpdateProject}
        />
      )}

    </div>
  );
}
