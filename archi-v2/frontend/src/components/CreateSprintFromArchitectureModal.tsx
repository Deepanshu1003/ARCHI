import React, { useState, useEffect } from 'react';
import { Project, AgentNode, Sprint, SprintTask, SprintSubTask } from '../types';
import { Sparkles, Calendar, Layers, User, ArrowRight, Plus, Trash2, ShieldCheck, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CreateSprintFromArchitectureModalProps {
  project: Project;
  authorAgent: AgentNode;
  architectureText: string;
  isOpen?: boolean;
  onClose: () => void;
  onCreateSprint: (sprint: Sprint) => void;
}

interface TempTaskItem {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  deadlineDays: number;
}

export function CreateSprintFromArchitectureModal({
  project,
  authorAgent,
  architectureText,
  isOpen,
  onClose,
  onCreateSprint
}: CreateSprintFromArchitectureModalProps) {
  if (!isOpen) return null;

  // Direct reportees list for the author agent
  const directReports = (authorAgent.childrenIds || [])
    .map(id => project.agents[id])
    .filter((a): a is AgentNode => Boolean(a));

  // Form States
  const [sprintName, setSprintName] = useState(
    `Sprint: ${authorAgent.personName}'s ${authorAgent.roleName.replace(/\(.*?\)/g, '').trim()} Deliverables`
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Suggested / User tasks
  const [tasks, setTasks] = useState<TempTaskItem[]>([]);

  // Initialize tasks based on architecture text or default breakdown on open
  useEffect(() => {
    // Parse headers or key lines from architecture text
    const lines = architectureText.split('\n').map(l => l.trim()).filter(Boolean);
    const headers = lines
      .filter(l => l.startsWith('#') || l.startsWith('1.') || l.startsWith('2.') || l.startsWith('- ['))
      .map(l => l.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '').replace(/^-\s*\[.*?\]\s*/, '').trim())
      .filter(l => l.length > 5 && !l.toLowerCase().includes('overview') && !l.toLowerCase().includes('design principles'));

    const initialTaskTitles = headers.length > 0 
      ? headers.slice(0, 3) 
      : [
          `Execute ${authorAgent.roleName} System Architecture`,
          `Define Interface Ports & Integration Schemas`,
          `Implement Core Domain Services & Data Flow`
        ];

    const defaultAssignee = directReports[0]?.id || authorAgent.id;

    setTasks(
      initialTaskTitles.map((title, idx) => ({
        id: `temp-${idx}-${Date.now()}`,
        title,
        description: `Deliverable extracted from ${authorAgent.personName}'s architecture specification.`,
        assignedTo: idx === 0 ? authorAgent.id : (directReports[idx - 1]?.id || defaultAssignee),
        deadlineDays: 3 + (idx * 2)
      }))
    );
  }, [authorAgent, architectureText]);

  const handleAddTask = () => {
    const defaultAssignee = directReports[0]?.id || authorAgent.id;
    setTasks(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: 'New Architecture Milestone Task',
        description: 'Specify deliverables and acceptance criteria.',
        assignedTo: defaultAssignee,
        deadlineDays: 5
      }
    ]);
  };

  const handleRemoveTask = (id: string) => {
    if (tasks.length <= 1) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTask = (id: string, field: keyof TempTaskItem, value: any) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    const formattedTasks: SprintTask[] = tasks.map(t => ({
      taskId: `task-${uuidv4().slice(0, 8)}`,
      parentTaskId: null,
      title: t.title.trim() || 'Architecture Implementation Task',
      description: t.description.trim(),
      assignedTo: t.assignedTo,
      assignedBy: authorAgent.id,
      deadlineDays: Number(t.deadlineDays) || 3,
      status: 'TODO',
      subTasks: []
    }));

    const newSprint: Sprint = {
      sprintId: `sprint-${uuidv4().slice(0, 8)}`,
      sprintName: sprintName.trim(),
      createdBy: authorAgent.id,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      status: 'ACTIVE',
      assignedMembers: Object.keys(project.agents),
      tasks: formattedTasks
    };

    onCreateSprint(newSprint);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 my-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Build Sprint Plan from Architecture</h2>
              <p className="text-xs text-neutral-500">
                Author: <strong>{authorAgent.personName}</strong> ({authorAgent.roleName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sprint Name and Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-neutral-700 block mb-1">Sprint Name</label>
              <input
                type="text"
                value={sprintName}
                onChange={e => setSprintName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Target End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Direct Reports & Assignment Guidance */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Hierarchical Task Assignment Strategy</p>
              <p className="text-indigo-700 text-[11px] mt-0.5">
                {directReports.length > 0 ? (
                  <>
                    <strong>{authorAgent.personName}</strong> can assign tasks directly to himself/herself or delegate down to direct reportees: {directReports.map(r => `${r.personName} (${r.roleName})`).join(', ')}.
                  </>
                ) : (
                  <>
                    <strong>{authorAgent.personName}</strong> has no direct reportees attached. Tasks will be assigned directly to {authorAgent.personName} or selected team members.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Task Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Sprint Deliverables & Deadlines
              </label>
              <button
                type="button"
                onClick={handleAddTask}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {tasks.map((task, idx) => (
                <div key={task.id} className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-neutral-200 text-neutral-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Task #{idx + 1}
                    </span>
                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(task.id)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                        title="Remove task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={task.title}
                    onChange={e => handleUpdateTask(task.id, 'title', e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500"
                    placeholder="Task title..."
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Assignee</label>
                      <select
                        value={task.assignedTo}
                        onChange={e => handleUpdateTask(task.id, 'assignedTo', e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:border-indigo-500"
                      >
                        <optgroup label="Self Assignment">
                          <option value={authorAgent.id}>
                            {authorAgent.personName} ({authorAgent.roleName}) - Self
                          </option>
                        </optgroup>
                        {directReports.length > 0 && (
                          <optgroup label="Direct Reportees">
                            {directReports.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.personName} ({r.roleName})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="All Team Members">
                          {Object.values(project.agents)
                            .filter(a => a.id !== authorAgent.id && !authorAgent.childrenIds.includes(a.id))
                            .map(a => (
                              <option key={a.id} value={a.id}>
                                {a.personName} ({a.roleName})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">
                        Deadline (Days)
                      </label>
                      <select
                        value={task.deadlineDays}
                        onChange={e => handleUpdateTask(task.id, 'deadlineDays', Number(e.target.value))}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-indigo-500"
                      >
                        {[1, 2, 3, 5, 7, 10, 14].map(days => (
                          <option key={days} value={days}>
                            {days} Days Deadline
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create & Open Sprint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
