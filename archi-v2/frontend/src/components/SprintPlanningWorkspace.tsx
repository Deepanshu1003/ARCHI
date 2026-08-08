import React, { useState } from 'react';
import { Project, AgentNode, Sprint, SprintTask, SprintSubTask, TaskStatus, SprintStatus } from '../types';
import { 
  Plus, Calendar, CheckCircle2, Clock, Play, Check, AlertTriangle, 
  Layers, ArrowDownRight, User, Shield, Sparkles, FileCode, Copy, 
  Download, Upload, Eye, Edit3, Trash2, ArrowLeft, ChevronDown, ChevronRight,
  GitPullRequest, CheckSquare, ListTodo, Filter, UserCheck, MessageSquare
} from 'lucide-react';
import { cn } from '../utils';
import { v4 as uuidv4 } from 'uuid';

interface SprintPlanningWorkspaceProps {
  project: Project;
  onUpdateProject: (p: Project) => void;
  onBackToWorkspace: () => void;
}

export function SprintPlanningWorkspace({
  project,
  onUpdateProject,
  onBackToWorkspace
}: SprintPlanningWorkspaceProps) {
  // Sprints state from project or empty record
  const sprintsMap = project.sprints || {};
  const sprintList = Object.values(sprintsMap);

  // Active Selected Sprint ID
  const [activeSprintId, setActiveSprintId] = useState<string>(
    sprintList[0]?.sprintId || ''
  );

  // Selected Filter for Level / Agent in Hierarchy
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // View Mode inside Sprint Planning: 'hierarchy' | 'kanban' | 'json_schema'
  const [sprintViewTab, setSprintViewTab] = useState<'hierarchy' | 'kanban' | 'json_schema'>('hierarchy');

  // Modal / Form states
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddSubtaskModal, setShowAddSubtaskModal] = useState<{ taskId: string } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<{ task: SprintTask; subTask?: SprintSubTask } | null>(null);
  const [showImportJsonModal, setShowImportJsonModal] = useState(false);

  // New Sprint Form state
  const [newSprintName, setNewSprintName] = useState('Sprint 1: Baseline Architecture');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // New Task Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedBy, setTaskAssignedBy] = useState<string>(project.rootAgentId);
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>('');
  const [taskDeadlineDays, setTaskDeadlineDays] = useState<number>(5);

  // New Subtask Form state
  const [subTaskTitle, setSubTaskTitle] = useState('');
  const [subTaskAssignedTo, setSubTaskAssignedTo] = useState<string>('');
  const [subTaskDeadlineDays, setSubTaskDeadlineDays] = useState<number>(3);

  // Review & Diff notes
  const [reviewNotes, setReviewNotes] = useState('');
  const [executionDiffText, setExecutionDiffText] = useState('');
  const [jsonInputText, setJsonInputText] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Active Sprint object
  const activeSprint = sprintsMap[activeSprintId] || sprintList[0] || null;

  // Root Agent (Level 1)
  const rootAgent = project.agents[project.rootAgentId];

  // Helper to compute agent hierarchy depth level
  const getAgentLevel = (agentId: string): number => {
    let level = 1;
    let curr = project.agents[agentId];
    while (curr && curr.parentId) {
      level++;
      curr = project.agents[curr.parentId];
    }
    return level;
  };

  // Create Baseline Sprint automatically if none exist
  const handleCreateDefaultSprint = () => {
    const rootId = project.rootAgentId;
    const directReports = rootAgent?.childrenIds || [];
    const level2AgentId = directReports[0] || rootId;
    const level3AgentId = (project.agents[level2AgentId]?.childrenIds || [])[0] || level2AgentId;

    const newSprint: Sprint = {
      sprintId: `sprint-${uuidv4().slice(0, 8)}`,
      sprintName: 'Sprint 1: System Baseline Core & Infrastructure',
      createdBy: rootId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      assignedMembers: Object.keys(project.agents),
      tasks: [
        {
          taskId: `task-${uuidv4().slice(0, 8)}`,
          parentTaskId: null,
          title: 'Establish System Architecture Ports & REST Specs',
          description: 'Macro-level task assigned by Head Architect to Domain Lead to construct module boundaries.',
          assignedTo: level2AgentId,
          assignedBy: rootId,
          deadlineDays: 7,
          status: 'IN_PROGRESS',
          executionDiff: '```ts\n// Proposed System Boundary Interface\nexport interface DomainPort {\n  execute(payload: any): Promise<void>;\n}\n```',
          subTasks: [
            {
              subTaskId: `subtask-${uuidv4().slice(0, 8)}`,
              title: 'Implement Core Data Persistence Schema',
              assignedTo: level3AgentId,
              assignedBy: level2AgentId,
              deadlineDays: 3,
              status: 'AWAITING_REVIEW',
              executionDiff: '```sql\nCREATE TABLE system_events (\n  id UUID PRIMARY KEY,\n  event_type VARCHAR(255) NOT NULL,\n  payload JSONB NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n```'
            },
            {
              subTaskId: `subtask-${uuidv4().slice(0, 8)}`,
              title: 'Build API Gateway Controller Middlewares',
              assignedTo: level3AgentId,
              assignedBy: level2AgentId,
              deadlineDays: 5,
              status: 'TODO'
            }
          ]
        },
        {
          taskId: `task-${uuidv4().slice(0, 8)}`,
          parentTaskId: null,
          title: 'Setup Client State Orchestration Engine',
          description: 'Frontend Lead task for reactive state management and view routing.',
          assignedTo: directReports[1] || level2AgentId,
          assignedBy: rootId,
          deadlineDays: 5,
          status: 'TODO',
          subTasks: []
        }
      ]
    };

    const updatedSprints = { ...sprintsMap, [newSprint.sprintId]: newSprint };
    onUpdateProject({
      ...project,
      sprints: updatedSprints
    });
    setActiveSprintId(newSprint.sprintId);
  };

  // Handle Save New Custom Sprint
  const handleSaveCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    const newSprint: Sprint = {
      sprintId: `sprint-${uuidv4().slice(0, 8)}`,
      sprintName: newSprintName.trim() || 'Sprint Planning Cycle',
      createdBy: project.rootAgentId,
      startDate: new Date(newStartDate).toISOString(),
      endDate: new Date(newEndDate).toISOString(),
      status: 'ACTIVE',
      assignedMembers: Object.keys(project.agents),
      tasks: []
    };

    const updatedSprints = { ...sprintsMap, [newSprint.sprintId]: newSprint };
    onUpdateProject({
      ...project,
      sprints: updatedSprints
    });
    setActiveSprintId(newSprint.sprintId);
    setShowCreateSprintModal(false);
  };

  // Save new Task inside active Sprint
  const handleSaveAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSprint || !taskTitle.trim() || !taskAssignedTo) return;

    const newTask: SprintTask = {
      taskId: `task-${uuidv4().slice(0, 8)}`,
      parentTaskId: null,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      assignedTo: taskAssignedTo,
      assignedBy: taskAssignedBy,
      deadlineDays: taskDeadlineDays,
      status: 'TODO',
      subTasks: []
    };

    const updatedSprint: Sprint = {
      ...activeSprint,
      tasks: [...activeSprint.tasks, newTask]
    };

    onUpdateProject({
      ...project,
      sprints: { ...sprintsMap, [activeSprint.sprintId]: updatedSprint }
    });

    setTaskTitle('');
    setTaskDescription('');
    setShowAddTaskModal(false);
  };

  // Save new Subtask inside active Sprint
  const handleSaveAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSprint || !showAddSubtaskModal || !subTaskTitle.trim() || !subTaskAssignedTo) return;

    const targetTask = activeSprint.tasks.find(t => t.taskId === showAddSubtaskModal.taskId);
    if (!targetTask) return;

    const newSubTask: SprintSubTask = {
      subTaskId: `subtask-${uuidv4().slice(0, 8)}`,
      title: subTaskTitle.trim(),
      assignedTo: subTaskAssignedTo,
      assignedBy: targetTask.assignedTo, // Assigned by task's owner
      deadlineDays: subTaskDeadlineDays,
      status: 'TODO'
    };

    const updatedTasks = activeSprint.tasks.map(t => {
      if (t.taskId === targetTask.taskId) {
        return {
          ...t,
          subTasks: [...t.subTasks, newSubTask]
        };
      }
      return t;
    });

    const updatedSprint: Sprint = {
      ...activeSprint,
      tasks: updatedTasks
    };

    onUpdateProject({
      ...project,
      sprints: { ...sprintsMap, [activeSprint.sprintId]: updatedSprint }
    });

    setSubTaskTitle('');
    setShowAddSubtaskModal(null);
  };

  // AI Auto-Delegate Macro Sprint Epics from Architecture Blueprint
  const handleAiAutoDelegateSprint = () => {
    if (!activeSprint) return;

    const rootId = project.rootAgentId;
    const directLeads = rootAgent?.childrenIds || [];

    const generatedTasks: SprintTask[] = directLeads.map((leadId, idx) => {
      const leadAgent = project.agents[leadId];
      const leafAgents = leadAgent?.childrenIds || [];

      return {
        taskId: `task-${uuidv4().slice(0, 8)}`,
        parentTaskId: null,
        title: `Architectural Scope: ${leadAgent?.roleName || 'Domain Module'}`,
        description: `Macro Epic delegated by Head Architect to ${leadAgent?.personName}. Primary focus: ${leadAgent?.responsibilities}`,
        assignedTo: leadId,
        assignedBy: rootId,
        deadlineDays: 7 + (idx * 2),
        status: 'IN_PROGRESS',
        executionDiff: `// Auto-generated domain scope for ${leadAgent?.personName}\n// Based on responsibilities: ${leadAgent?.responsibilities}`,
        subTasks: leafAgents.map(leafId => {
          const leafAgent = project.agents[leafId];
          return {
            subTaskId: `subtask-${uuidv4().slice(0, 8)}`,
            title: `Implement ${leafAgent?.roleName || 'Component Specification'}`,
            assignedTo: leafId,
            assignedBy: leadId,
            deadlineDays: 3,
            status: 'TODO'
          };
        })
      };
    });

    const updatedSprint: Sprint = {
      ...activeSprint,
      tasks: [...activeSprint.tasks, ...generatedTasks]
    };

    onUpdateProject({
      ...project,
      sprints: { ...sprintsMap, [activeSprint.sprintId]: updatedSprint }
    });
  };

  // Handle Submit Execution Diff / Change Status
  const handleUpdateTaskStatus = (
    taskId: string, 
    subTaskId: string | null, 
    nextStatus: TaskStatus, 
    diffText?: string
  ) => {
    if (!activeSprint) return;

    const updatedTasks = activeSprint.tasks.map(task => {
      if (subTaskId) {
        if (task.taskId === taskId) {
          return {
            ...task,
            subTasks: task.subTasks.map(st => {
              if (st.subTaskId === subTaskId) {
                return {
                  ...st,
                  status: nextStatus,
                  ...(diffText !== undefined ? { executionDiff: diffText } : {})
                };
              }
              return st;
            })
          };
        }
        return task;
      } else {
        if (task.taskId === taskId) {
          return {
            ...task,
            status: nextStatus,
            ...(diffText !== undefined ? { executionDiff: diffText } : {})
          };
        }
        return task;
      }
    });

    const updatedSprint: Sprint = {
      ...activeSprint,
      tasks: updatedTasks
    };

    onUpdateProject({
      ...project,
      sprints: { ...sprintsMap, [activeSprint.sprintId]: updatedSprint }
    });
  };

  // Supervisor Approval Action
  const handleApproveTaskOrSubtask = (
    taskId: string, 
    subTaskId: string | null, 
    approved: boolean, 
    notes: string
  ) => {
    if (!activeSprint) return;

    const nextStatus: TaskStatus = approved ? 'DONE' : 'IN_PROGRESS';

    const updatedTasks = activeSprint.tasks.map(task => {
      if (subTaskId) {
        if (task.taskId === taskId) {
          return {
            ...task,
            subTasks: task.subTasks.map(st => {
              if (st.subTaskId === subTaskId) {
                return {
                  ...st,
                  status: nextStatus,
                  reviewNotes: notes
                };
              }
              return st;
            })
          };
        }
        return task;
      } else {
        if (task.taskId === taskId) {
          return {
            ...task,
            status: nextStatus,
            reviewNotes: notes
          };
        }
        return task;
      }
    });

    const updatedSprint: Sprint = {
      ...activeSprint,
      tasks: updatedTasks
    };

    onUpdateProject({
      ...project,
      sprints: { ...sprintsMap, [activeSprint.sprintId]: updatedSprint }
    });

    setShowReviewModal(null);
    setReviewNotes('');
  };

  // Import JSON handler
  const handleImportSprintJson = () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      if (!parsed.sprintId || !parsed.sprintName || !Array.isArray(parsed.tasks)) {
        alert("Invalid Sprint JSON schema. Must include sprintId, sprintName, and tasks array.");
        return;
      }

      const updatedSprints = { ...sprintsMap, [parsed.sprintId]: parsed as Sprint };
      onUpdateProject({
        ...project,
        sprints: updatedSprints
      });
      setActiveSprintId(parsed.sprintId);
      setShowImportJsonModal(false);
      setJsonInputText('');
    } catch (e: any) {
      alert("Error parsing JSON: " + e.message);
    }
  };

  // Compute deadline days statistics
  const totalDeadlineDays = activeSprint?.tasks.reduce((sum, t) => {
    const mainDays = t.deadlineDays || 0;
    const subDays = t.subTasks.reduce((s, st) => s + (st.deadlineDays || 0), 0);
    return sum + mainDays + subDays;
  }, 0) || 0;

  const completedDeadlineDays = activeSprint?.tasks.reduce((sum, t) => {
    let mainDays = t.status === 'DONE' ? (t.deadlineDays || 0) : 0;
    let subDays = t.subTasks.reduce((s, st) => s + (st.status === 'DONE' ? (st.deadlineDays || 0) : 0), 0);
    return sum + mainDays + subDays;
  }, 0) || 0;

  const progressPercent = totalDeadlineDays > 0 ? Math.round((completedDeadlineDays / totalDeadlineDays) * 100) : 0;

  // Count pending reviews across tasks & subtasks
  const pendingReviewsCount = activeSprint?.tasks.reduce((count, t) => {
    let c = t.status === 'AWAITING_REVIEW' ? 1 : 0;
    c += t.subTasks.filter(st => st.status === 'AWAITING_REVIEW').length;
    return count + c;
  }, 0) || 0;

  // Copy JSON handler
  const handleCopyJson = () => {
    if (!activeSprint) return;
    navigator.clipboard.writeText(JSON.stringify(activeSprint, null, 2));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Download JSON handler
  const handleDownloadJson = () => {
    if (!activeSprint) return;
    const blob = new Blob([JSON.stringify(activeSprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSprint.sprintName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 overflow-hidden font-sans">
      {/* Top Workspace Header */}
      <header className="bg-white border-b border-neutral-200/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <button 
            onClick={onBackToWorkspace} 
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 rounded-xl text-xs font-bold transition-colors border border-neutral-200/80 flex items-center gap-1.5 shrink-0"
            title="Back to Workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>Agent Workspace</span>
          </button>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <ListTodo className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-neutral-900 truncate">Sprint Planning Workspace</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-100">
                Hierarchical Orchestrator
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium truncate">
              Macro Delegation • Downward Scope Slicing • Upward Supervisor Approvals
            </p>
          </div>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {pendingReviewsCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-800 font-bold text-xs animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{pendingReviewsCount} Review Requests</span>
            </div>
          )}

          <button
            onClick={() => setShowCreateSprintModal(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Sprint</span>
          </button>

          <button
            onClick={() => setShowImportJsonModal(true)}
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold transition-all border border-neutral-200 flex items-center gap-1.5 shadow-2xs"
            title="Import Sprint JSON Schema"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import JSON</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {sprintList.length === 0 ? (
        /* Empty State: Create First Sprint */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-50">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">No Active Sprints Found</h2>
          <p className="text-xs text-neutral-500 max-w-md mb-6 leading-relaxed">
            Initialize your team's baseline Sprint Planning workspace to delegate macro epics downward through the hierarchy and enforce supervisor approvals.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateDefaultSprint}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Initialize Sprint 1: System Baseline</span>
            </button>
            <button
              onClick={() => setShowCreateSprintModal(true)}
              className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold transition-all border border-neutral-200 shadow-2xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Custom Sprint</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Sprint Selector & Stats Control Bar */}
          <div className="bg-white border-b border-neutral-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
            {/* Active Sprint Dropdown & Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider shrink-0">Sprint:</span>
                <select
                  value={activeSprintId}
                  onChange={(e) => setActiveSprintId(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 max-w-xs truncate shadow-2xs"
                >
                  {sprintList.map(s => (
                    <option key={s.sprintId} value={s.sprintId}>
                      {s.sprintName} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              {activeSprint && (
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px]">
                    {activeSprint.status}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Deadline Days & Progress Bar */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500">
                    <span>PROGRESS</span>
                    <span>{completedDeadlineDays} / {totalDeadlineDays} Days ({progressPercent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* View Mode Tabs */}
              <div className="bg-neutral-100 p-0.5 rounded-xl flex items-center gap-0.5 border border-neutral-200">
                <button
                  onClick={() => setSprintViewTab('hierarchy')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    sprintViewTab === 'hierarchy' ? "bg-indigo-600 text-white shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Hierarchy Matrix</span>
                </button>
                <button
                  onClick={() => setSprintViewTab('kanban')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    sprintViewTab === 'kanban' ? "bg-indigo-600 text-white shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
                  )}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Kanban Board</span>
                </button>
                <button
                  onClick={() => setSprintViewTab('json_schema')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    sprintViewTab === 'json_schema' ? "bg-indigo-600 text-white shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
                  )}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>JSON Inspector</span>
                </button>
              </div>
            </div>
          </div>

          {/* View Tab 1: Hierarchy Matrix View */}
          {sprintViewTab === 'hierarchy' && activeSprint && (
            <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 overflow-y-auto p-6">
              {/* Hierarchical Guidance Banner & Quick AI Auto-Delegate */}
              <div className="mb-6 p-4 bg-white border border-neutral-200/90 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Dynamic Delegation Protocol</h3>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">
                      Level 1 assigns macro Epics to Level 2 Leads → Level 2 slices into Tasks for Level 3 Specialists → Level 3 submits Execution Diffs for Supervisor Review.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAiAutoDelegateSprint}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-indigo-200/60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Auto-Delegate Scope</span>
                  </button>
                  <button
                    onClick={() => {
                      setTaskAssignedBy(project.rootAgentId);
                      setShowAddTaskModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Tasks List grouped by Hierarchy */}
              {activeSprint.tasks.length === 0 ? (
                <div className="p-12 text-center bg-white border border-neutral-200 rounded-2xl shadow-2xs">
                  <p className="text-xs font-bold text-neutral-600 mb-2">No Tasks Created in this Sprint</p>
                  <p className="text-xs text-neutral-400 mb-4">Click "Add Task" or "Auto-Delegate Scope" to populate deliverables.</p>
                  <button
                    onClick={handleAiAutoDelegateSprint}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    ✨ Auto-Generate Tasks
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSprint.tasks.map(task => {
                    const assignedAgent = project.agents[task.assignedTo];
                    const assignerAgent = project.agents[task.assignedBy];
                    const level = getAgentLevel(task.assignedTo);

                    return (
                      <div 
                        key={task.taskId}
                        className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 transition-all"
                      >
                        {/* Task Header */}
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5",
                              level === 1 ? "bg-purple-100 text-purple-800" :
                              level === 2 ? "bg-indigo-100 text-indigo-800" : "bg-blue-100 text-blue-800"
                            )}>
                              Level {level} Epic
                            </span>

                            <div>
                              <h4 className="text-sm font-bold text-neutral-900 leading-snug">{task.title}</h4>
                              {task.description && (
                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{task.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-lg border border-neutral-200">
                              {task.deadlineDays || 0} Days
                            </span>

                            <span className={cn(
                              "px-2.5 py-1 rounded-xl text-xs font-bold border",
                              task.status === 'DONE' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              task.status === 'AWAITING_REVIEW' ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                              task.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-neutral-50 text-neutral-600 border-neutral-200"
                            )}>
                              {task.status}
                            </span>

                            {task.status === 'AWAITING_REVIEW' && (
                              <button
                                onClick={() => setShowReviewModal({ task })}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                              >
                                Review Diff
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Assignee & Delegation Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 font-medium">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-neutral-400">Assigned To:</span>
                              <strong className="text-neutral-800 font-bold">{assignedAgent?.personName} ({assignedAgent?.roleName})</strong>
                            </span>

                            <span className="flex items-center gap-1 text-neutral-400">
                              <span>Delegated By:</span>
                              <strong className="text-neutral-700 font-semibold">{assignerAgent?.personName}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSubTaskAssignedTo('');
                                setShowAddSubtaskModal({ taskId: task.taskId });
                              }}
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-700 text-neutral-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-neutral-200"
                            >
                              <Plus className="w-3 h-3 text-indigo-600" />
                              <span>Slice Subtask</span>
                            </button>
                          </div>
                        </div>

                        {/* Execution Diff Snippet if provided */}
                        {task.executionDiff && (
                          <div className="mt-3 p-3 bg-neutral-900 rounded-xl font-mono text-xs text-neutral-200 overflow-x-auto border border-neutral-800">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Proposed Execution Diff</div>
                            <pre className="whitespace-pre-wrap">{task.executionDiff}</pre>
                          </div>
                        )}

                        {/* Subtasks Hierarchy Block */}
                        {task.subTasks.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2.5 pl-4 border-l-2 border-indigo-100">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                              Sliced Subtasks ({task.subTasks.length})
                            </div>

                            {task.subTasks.map(subTask => {
                              const subAssigned = project.agents[subTask.assignedTo];

                              return (
                                <div 
                                  key={subTask.subTaskId}
                                  className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <ArrowDownRight className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div>
                                      <p className="font-bold text-neutral-900">{subTask.title}</p>
                                      <p className="text-[11px] text-neutral-500">
                                        Assigned to <strong className="text-neutral-700">{subAssigned?.personName}</strong> ({subAssigned?.roleName})
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="px-2 py-0.5 bg-white text-neutral-700 text-[11px] font-bold rounded border border-neutral-200">
                                      {subTask.deadlineDays || 0} Days
                                    </span>

                                    <span className={cn(
                                      "px-2 py-0.5 rounded-lg text-[11px] font-bold border",
                                      subTask.status === 'DONE' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      subTask.status === 'AWAITING_REVIEW' ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                                      subTask.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      "bg-white text-neutral-600 border-neutral-200"
                                    )}>
                                      {subTask.status}
                                    </span>

                                    {subTask.status === 'AWAITING_REVIEW' ? (
                                      <button
                                        onClick={() => setShowReviewModal({ task, subTask })}
                                        className="px-2.5 py-1 bg-amber-600 text-white font-bold text-[11px] rounded-lg shadow-2xs"
                                      >
                                        Review Diff
                                      </button>
                                    ) : (
                                      <select
                                        value={subTask.status}
                                        onChange={(e) => handleUpdateTaskStatus(task.taskId, subTask.subTaskId, e.target.value as TaskStatus)}
                                        className="bg-white border border-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg px-2 py-1 outline-none"
                                      >
                                        <option value="TODO">TODO</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="AWAITING_REVIEW">AWAITING_REVIEW</option>
                                        <option value="DONE">DONE</option>
                                      </select>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* View Tab 2: Kanban Board View */}
          {sprintViewTab === 'kanban' && activeSprint && (
            <div className="flex-1 flex min-h-0 bg-neutral-50 overflow-x-auto p-6 gap-4">
              {(['TODO', 'IN_PROGRESS', 'AWAITING_REVIEW', 'DONE'] as TaskStatus[]).map(statusKey => {
                const columnTasks = activeSprint.tasks.filter(t => t.status === statusKey);

                return (
                  <div key={statusKey} className="w-80 shrink-0 flex flex-col bg-neutral-100/70 border border-neutral-200/80 rounded-2xl p-3 min-h-0">
                    <div className="flex items-center justify-between pb-3 px-1 border-b border-neutral-200/80 mb-3">
                      <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          statusKey === 'DONE' ? "bg-emerald-500" :
                          statusKey === 'AWAITING_REVIEW' ? "bg-amber-500 animate-pulse" :
                          statusKey === 'IN_PROGRESS' ? "bg-blue-500" : "bg-neutral-400"
                        )} />
                        {statusKey}
                      </span>
                      <span className="text-xs font-bold text-neutral-500 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                      {columnTasks.map(task => {
                        const assignedAgent = project.agents[task.assignedTo];

                        return (
                          <div 
                            key={task.taskId} 
                            className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-2"
                          >
                            <h5 className="text-xs font-bold text-neutral-900 leading-snug">{task.title}</h5>
                            {task.description && (
                              <p className="text-[11px] text-neutral-500 line-clamp-2">{task.description}</p>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                              <span className="font-semibold text-neutral-700">{assignedAgent?.personName}</span>
                              <span className="font-bold text-neutral-800 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                                {task.deadlineDays || 0} Days
                              </span>
                            </div>

                            {statusKey === 'AWAITING_REVIEW' ? (
                              <button
                                onClick={() => setShowReviewModal({ task })}
                                className="w-full py-1 bg-amber-600 text-white font-bold text-[11px] rounded-lg shadow-2xs mt-1"
                              >
                                Review Diff
                              </button>
                            ) : (
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTaskStatus(task.taskId, null, e.target.value as TaskStatus)}
                                className="w-full bg-neutral-50 border border-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg px-2 py-1 outline-none mt-1"
                              >
                                <option value="TODO">TODO</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="AWAITING_REVIEW">AWAITING_REVIEW</option>
                                <option value="DONE">DONE</option>
                              </select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* View Tab 3: JSON Inspector */}
          {sprintViewTab === 'json_schema' && activeSprint && (
            <div className="flex-1 flex flex-col min-h-0 bg-neutral-900 p-6 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                <span className="text-xs font-bold text-neutral-300 font-mono">Sprint Dynamic State JSON (Generic Schema)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-neutral-700"
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSuccess ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-neutral-950 rounded-xl p-4 overflow-auto border border-neutral-800 font-mono text-xs text-emerald-400 leading-relaxed">
                <pre>{JSON.stringify(activeSprint, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Create Custom Sprint */}
      {showCreateSprintModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Create Macro Sprint</h3>
            <form onSubmit={handleSaveCreateSprint} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Sprint Name</label>
                <input
                  type="text"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                  placeholder="e.g., Sprint 1: System Baseline Core"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSprintModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Macro Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Add Sprint Deliverable / Epic</h3>
            <form onSubmit={handleSaveAddTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                  placeholder="e.g. Build Dynamic State Persistence Layer"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 resize-none"
                  placeholder="Technical scope and acceptance criteria..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Assigned By (Supervisor)</label>
                  <select
                    value={taskAssignedBy}
                    onChange={(e) => setTaskAssignedBy(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                  >
                    {Object.values(project.agents).map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.personName} ({agent.roleName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Assigned To (Assignee)</label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Member...</option>
                    {Object.values(project.agents).map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.personName} ({agent.roleName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Deadline (Days)</label>
                <select
                  value={taskDeadlineDays}
                  onChange={(e) => setTaskDeadlineDays(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
                >
                  {[1, 2, 3, 5, 7, 10, 14, 21].map(d => (
                    <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''} Deadline</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Sliced Subtask */}
      {showAddSubtaskModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Slice Granular Subtask</h3>
            <form onSubmit={handleSaveAddSubtask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Subtask Title</label>
                <input
                  type="text"
                  value={subTaskTitle}
                  onChange={(e) => setSubTaskTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                  placeholder="e.g. Implement JSON Serialization Engine"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Assigned Specialist</label>
                <select
                  value={subTaskAssignedTo}
                  onChange={(e) => setSubTaskAssignedTo(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select Sub-Specialist...</option>
                  {Object.values(project.agents).map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.personName} ({agent.roleName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Deadline (Days)</label>
                <select
                  value={subTaskDeadlineDays}
                  onChange={(e) => setSubTaskDeadlineDays(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
                >
                  {[1, 2, 3, 5, 7, 10].map(d => (
                    <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''} Deadline</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubtaskModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Add Subtask
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Review Task Diff & Supervisor Approval */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-neutral-900">Supervisor Diff Review & Upward Approval</h3>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4 space-y-2">
              <p className="text-xs font-bold text-neutral-900">
                Item: {showReviewModal.subTask ? showReviewModal.subTask.title : showReviewModal.task.title}
              </p>
              <p className="text-xs text-neutral-600">
                Submitted by: <strong>{project.agents[showReviewModal.subTask ? showReviewModal.subTask.assignedTo : showReviewModal.task.assignedTo]?.personName}</strong>
              </p>

              {(showReviewModal.subTask?.executionDiff || showReviewModal.task.executionDiff) && (
                <div className="bg-neutral-900 text-neutral-200 p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-48 mt-2">
                  <pre>{showReviewModal.subTask?.executionDiff || showReviewModal.task.executionDiff}</pre>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-neutral-700 block mb-1">Supervisor Review Notes / Feedback</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={2}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 resize-none"
                placeholder="Optional feedback or approval statement..."
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowReviewModal(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApproveTaskOrSubtask(showReviewModal.task.taskId, showReviewModal.subTask?.subTaskId || null, false, reviewNotes)}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors"
                >
                  Request Revisions
                </button>

                <button
                  onClick={() => handleApproveTaskOrSubtask(showReviewModal.task.taskId, showReviewModal.subTask?.subTaskId || null, true, reviewNotes)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Complete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Import JSON Schema */}
      {showImportJsonModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-2">Import Sprint JSON State</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Paste a custom JSON payload matching the ARCHI Sprint Schema to import or update a sprint structure.
            </p>

            <textarea
              value={jsonInputText}
              onChange={(e) => setJsonInputText(e.target.value)}
              rows={8}
              className="w-full font-mono bg-neutral-900 text-emerald-400 border border-neutral-800 rounded-xl p-3 text-xs outline-none resize-none mb-4"
              placeholder={`{\n  "sprintId": "sprint-101",\n  "sprintName": "Sprint 1: Baseline",\n  "createdBy": "${project.rootAgentId}",\n  ...\n}`}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportJsonModal(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSprintJson}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Import Sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
