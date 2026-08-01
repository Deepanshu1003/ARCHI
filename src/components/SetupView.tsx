import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project, AgentNode } from '../types';
import { 
  ArrowLeft, User, Plus, Trash2, Play, Upload, FileCode, Download, Copy, Check, Code, 
  AlertCircle, X, FileText, ZoomIn, ZoomOut, Maximize2, RotateCcw, List, Grid, Users, LayoutGrid
} from 'lucide-react';
import { cn } from '../utils';

interface SetupViewProps {
  project: Project;
  onStartExecution: (project: Project) => void;
  onBack: () => void;
}

export function SetupView({ project, onStartExecution, onBack }: SetupViewProps) {
  const [localProject, setLocalProject] = useState<Project>(project);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [showSampleSchema, setShowSampleSchema] = useState(false);

  // Zoom & View layout states for fitting all agents on screen
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [viewDensity, setViewDensity] = useState<'normal' | 'compact' | 'list'>('normal');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAgentsCount = Object.keys(localProject.agents || {}).length;

  const handleFitToScreen = () => {
    if (totalAgentsCount > 12) {
      setZoomLevel(0.5);
    } else if (totalAgentsCount > 7) {
      setZoomLevel(0.65);
    } else if (totalAgentsCount > 4) {
      setZoomLevel(0.8);
    } else {
      setZoomLevel(1.0);
    }
  };

  const updateProjectName = (name: string) => {
    setLocalProject(prev => ({ ...prev, name }));
  };

  const updateAgent = (id: string, updates: Partial<AgentNode>) => {
    setLocalProject(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [id]: { ...prev.agents[id], ...updates }
      }
    }));
  };

  const addSubordinate = (parentId: string) => {
    const childId = uuidv4();
    const newAgent: AgentNode = {
      id: childId,
      parentId,
      roleName: 'New Specialist Role',
      personName: 'New Team Member',
      responsibilities: 'Describe domain responsibilities and technical scope here...',
      status: 'idle',
      decisions: '',
      chatHistory: [],
      childrenIds: []
    };

    setLocalProject(prev => {
      const parent = prev.agents[parentId];
      return {
        ...prev,
        agents: {
          ...prev.agents,
          [parentId]: { ...parent, childrenIds: [...parent.childrenIds, childId] },
          [childId]: newAgent
        }
      };
    });
  };

  const deleteAgent = (id: string, parentId: string) => {
    setLocalProject(prev => {
      const newAgents = { ...prev.agents };
      const parent = newAgents[parentId];
      
      // Recursively delete children
      const deleteRecursive = (agentId: string) => {
        const agent = newAgents[agentId];
        if (agent) {
          agent.childrenIds.forEach(deleteRecursive);
          delete newAgents[agentId];
        }
      };
      
      deleteRecursive(id);
      
      if (parent) {
        newAgents[parentId] = {
          ...parent,
          childrenIds: parent.childrenIds.filter(cid => cid !== id)
        };
      }
      return { ...prev, agents: newAgents };
    });
  };

  // Validate and parse imported JSON object
  const validateAndApplyJson = (parsedData: any): boolean => {
    try {
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid JSON structure. Root object expected.');
      }

      const agents = parsedData.agents || parsedData.team || parsedData;
      if (!agents || typeof agents !== 'object' || Object.keys(agents).length === 0) {
        throw new Error('Invalid JSON: Must contain an "agents" object with agent nodes.');
      }

      // Check rootAgentId
      let rootId = parsedData.rootAgentId;
      if (!rootId || !agents[rootId]) {
        // Find agent with parentId null or fallback to first key
        const foundRoot = Object.values(agents).find((a: any) => !a.parentId);
        if (foundRoot && (foundRoot as any).id) {
          rootId = (foundRoot as any).id;
        } else {
          rootId = Object.keys(agents)[0];
        }
      }

      // Format and sanitize each agent
      const sanitizedAgents: Record<string, AgentNode> = {};
      Object.entries(agents).forEach(([key, val]: [string, any]) => {
        const id = val.id || key;
        sanitizedAgents[id] = {
          id,
          parentId: val.parentId || null,
          roleName: val.roleName || val.title || 'Specialist',
          personName: val.personName || val.name || 'Agent Persona',
          responsibilities: val.responsibilities || val.scope || 'Domain responsibilities',
          status: val.status || 'idle',
          decisions: val.decisions || '',
          chatHistory: Array.isArray(val.chatHistory) ? val.chatHistory : [],
          childrenIds: Array.isArray(val.childrenIds) ? val.childrenIds : []
        };
      });

      // Ensure root node exists
      if (!sanitizedAgents[rootId]) {
        throw new Error(`Root agent ID "${rootId}" was not found in agents dictionary.`);
      }

      setLocalProject(prev => ({
        ...prev,
        name: parsedData.name || prev.name,
        rootAgentId: rootId,
        agents: sanitizedAgents
      }));

      setJsonError(null);
      return true;
    } catch (err: any) {
      setJsonError(err.message || 'Failed to parse team hierarchy JSON.');
      return false;
    }
  };

  // Handle File Upload (.json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (validateAndApplyJson(parsed)) {
          alert('✅ Team hierarchy successfully imported from JSON file!');
        }
      } catch (err) {
        alert('❌ Error reading file: Invalid JSON file syntax.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // Handle Paste JSON submit
  const handlePasteSubmit = () => {
    if (!jsonInputText.trim()) {
      setJsonError('Please enter or paste JSON code.');
      return;
    }
    try {
      const parsed = JSON.parse(jsonInputText);
      if (validateAndApplyJson(parsed)) {
        setShowJsonModal(false);
        setJsonInputText('');
        setJsonError(null);
      }
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  // Download project configuration JSON
  const handleDownloadJson = () => {
    const exportData = {
      name: localProject.name,
      rootAgentId: localProject.rootAgentId,
      agents: localProject.agents
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${localProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-team-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy current JSON to clipboard
  const handleCopyJson = () => {
    const exportData = {
      name: localProject.name,
      rootAgentId: localProject.rootAgentId,
      agents: localProject.agents
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Pre-fill Paste modal with current hierarchy JSON
  const openPasteModal = () => {
    const currentConfig = {
      name: localProject.name,
      rootAgentId: localProject.rootAgentId,
      agents: localProject.agents
    };
    setJsonInputText(JSON.stringify(currentConfig, null, 2));
    setJsonError(null);
    setShowJsonModal(true);
  };

  const renderListNode = (agentId: string, level: number = 0) => {
    const agent = localProject.agents[agentId];
    if (!agent) return null;

    const isRoot = level === 0;

    return (
      <div key={agent.id} className="flex flex-col gap-2">
        <div 
          className={cn(
            "p-4 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all bg-white shadow-xs",
            isRoot ? "border-indigo-300 bg-indigo-50/20" : "border-neutral-200 hover:border-neutral-300"
          )}
          style={{ marginLeft: `${Math.min(level * 28, 160)}px` }}
        >
          <div className="flex items-center gap-3 shrink-0">
            <div className={cn("p-2 rounded-xl shrink-0", isRoot ? "bg-indigo-100 text-indigo-700" : "bg-neutral-100 text-neutral-600")}>
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-44">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-0.5">
                {isRoot ? 'Root Supervisor' : `Level ${level}`}
              </span>
              <input 
                type="text" 
                value={agent.personName}
                onChange={(e) => updateAgent(agent.id, { personName: e.target.value })}
                className="font-bold text-sm text-neutral-900 bg-transparent outline-none focus:border-b border-indigo-500"
                placeholder="Persona Name"
              />
              <input 
                type="text" 
                value={agent.roleName}
                onChange={(e) => updateAgent(agent.id, { roleName: e.target.value })}
                className="text-xs text-indigo-600 font-semibold bg-transparent outline-none focus:border-b border-indigo-500 mt-0.5"
                placeholder="Role Title"
              />
            </div>
          </div>

          <div className="flex-1 w-full lg:w-auto">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Responsibilities</label>
            <input 
              type="text" 
              value={agent.responsibilities}
              onChange={(e) => updateAgent(agent.id, { responsibilities: e.target.value })}
              className="w-full text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 focus:bg-white"
              placeholder="Responsibilities / Scope..."
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => addSubordinate(agent.id)}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-700 text-neutral-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors border border-transparent hover:border-indigo-200"
            >
              <Plus className="w-3.5 h-3.5" /> Direct Report
            </button>
            {!isRoot && (
              <button 
                onClick={() => deleteAgent(agent.id, agent.parentId!)} 
                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {agent.childrenIds.map(childId => renderListNode(childId, level + 1))}
      </div>
    );
  };

  const renderNode = (agentId: string, level: number = 0) => {
    const agent = localProject.agents[agentId];
    if (!agent) return null;

    const isRoot = level === 0;
    const isCompact = viewDensity === 'compact';

    return (
      <div key={agent.id} className="flex flex-col items-center">
        {/* Card */}
        <div className={cn(
          "relative flex flex-col rounded-2xl border-2 shadow-sm bg-white transition-all",
          isCompact ? "w-64 p-3.5" : "w-80 p-5",
          isRoot ? "border-indigo-300 shadow-indigo-100" : "border-neutral-200 hover:border-neutral-300"
        )}>
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-xl", isRoot ? "bg-indigo-100 text-indigo-700" : "bg-neutral-100 text-neutral-600")}>
                <User className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                {isRoot ? 'Root Supervisor' : `Level ${level}`}
              </span>
            </div>
            {!isRoot && (
              <button 
                onClick={() => deleteAgent(agent.id, agent.parentId!)} 
                className="text-neutral-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
                title="Delete Member & Subtree"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5 block">Role / Title</label>
              <input 
                type="text" 
                value={agent.roleName}
                onChange={(e) => updateAgent(agent.id, { roleName: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5 block">Person Name (Persona)</label>
              <input 
                type="text" 
                value={agent.personName}
                onChange={(e) => updateAgent(agent.id, { personName: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5 block">Responsibilities</label>
              <textarea 
                value={agent.responsibilities}
                onChange={(e) => updateAgent(agent.id, { responsibilities: e.target.value })}
                rows={isCompact ? 2 : 3}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 focus:bg-white resize-none"
              />
            </div>
          </div>
          
          <button 
            onClick={() => addSubordinate(agent.id)}
            className="mt-3 flex items-center justify-center gap-1 w-full py-1.5 bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-700 text-neutral-700 text-xs font-semibold rounded-lg transition-colors border border-transparent hover:border-indigo-200"
          >
            <Plus className="w-3.5 h-3.5" /> Add Direct Report
          </button>
        </div>

        {/* Children Render */}
        {agent.childrenIds.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <div className="w-px h-6 bg-neutral-300"></div>
            <div className="flex justify-center relative w-full">
              {agent.childrenIds.length > 1 && (
                <div className="absolute top-0 h-px bg-neutral-300" 
                     style={{ width: `calc(100% - ${100 / agent.childrenIds.length}%)` }}>
                </div>
              )}
              <div className={cn("flex justify-center w-full relative pt-3", isCompact ? "gap-4" : "gap-8")}>
                {agent.childrenIds.map((childId) => (
                  <div key={childId} className="relative flex flex-col items-center">
                    <div className="absolute -top-3 w-px h-3 bg-neutral-300"></div>
                    {renderNode(childId, level + 1)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Hidden File Input for JSON Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".json,application/json" 
        className="hidden" 
      />

      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Project Title</label>
            <input 
              type="text" 
              value={localProject.name}
              onChange={(e) => updateProjectName(e.target.value)}
              className="block text-xl font-display font-bold text-neutral-900 bg-transparent outline-none focus:border-b-2 border-indigo-500 w-64"
            />
          </div>
        </div>

        {/* Action Controls: JSON Import/Export & Start Execution */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload JSON Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Upload JSON File"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Upload JSON File</span>
          </button>

          {/* Paste / Edit JSON Button */}
          <button 
            onClick={openPasteModal}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Paste or Edit Raw JSON Code"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Paste/Edit JSON</span>
          </button>

          {/* Export JSON Download */}
          <button 
            onClick={handleDownloadJson}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Export Team Hierarchy as JSON File"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export JSON</span>
          </button>

          {/* Sample Schema Info */}
          <button 
            onClick={() => setShowSampleSchema(true)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="View JSON Format Specification"
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON Spec</span>
          </button>

          <div className="w-px h-6 bg-neutral-200 mx-1"></div>

          {/* Start Project Execution */}
          <button 
            onClick={() => onStartExecution(localProject)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200"
          >
            <span>Start Project</span>
            <Play className="w-4 h-4" />
          </button>
        </div>
      </header>
      
      {/* Sub-Header Toolbar: View Modes & Zoom Controls */}
      <div className="bg-neutral-100/80 border-b border-neutral-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        {/* Agent Count Badge & View Density Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-neutral-700 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-xs">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>{totalAgentsCount} Team Agent{totalAgentsCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-neutral-200 shadow-xs">
            <button
              onClick={() => { setViewDensity('normal'); setZoomLevel(1.0); }}
              className={cn("px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors", viewDensity === 'normal' ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900")}
              title="Full Hierarchy Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Normal
            </button>
            <button
              onClick={() => { setViewDensity('compact'); setZoomLevel(0.85); }}
              className={cn("px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors", viewDensity === 'compact' ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900")}
              title="Compact Cards for Large Teams"
            >
              <Grid className="w-3.5 h-3.5" /> Compact
            </button>
            <button
              onClick={() => setViewDensity('list')}
              className={cn("px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors", viewDensity === 'list' ? "bg-indigo-600 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900")}
              title="Indented List Outline View"
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
          </div>
        </div>

        {/* Zoom Controls (Only active for Tree and Compact views) */}
        {viewDensity !== 'list' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-xl border border-neutral-200 p-1 shadow-xs">
              <button 
                onClick={() => setZoomLevel(z => Math.max(0.3, +(z - 0.1).toFixed(2)))} 
                className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center font-mono font-semibold text-neutral-700 text-xs">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button 
                onClick={() => setZoomLevel(z => Math.min(1.5, +(z + 0.1).toFixed(2)))} 
                className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleFitToScreen}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl font-semibold border border-neutral-200 hover:border-indigo-200 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Auto-Fit All Agents to Viewport"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Fit to Screen
            </button>

            <button
              onClick={() => setZoomLevel(1.0)}
              className="p-1.5 bg-white hover:bg-neutral-100 text-neutral-600 rounded-xl border border-neutral-200 transition-colors shadow-xs"
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Visual Canvas or List View */}
      <main className="flex-1 overflow-auto bg-neutral-50/50 p-6 flex justify-center items-start">
        {viewDensity === 'list' ? (
          <div className="w-full max-w-5xl space-y-3 pb-16">
            {renderListNode(localProject.rootAgentId)}
          </div>
        ) : (
          <div 
            className="min-w-max pb-16 transition-transform duration-150 ease-out origin-top"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {renderNode(localProject.rootAgentId)}
          </div>
        )}
      </main>

      {/* Modal: Paste or Edit Raw JSON Code */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-600" />
                  Paste or Edit Team JSON Configuration
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Paste a valid JSON object or modify the raw JSON data below to dynamically update all team members and hierarchy links.
                </p>
              </div>
              <button 
                onClick={() => setShowJsonModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Syntax Error Alert */}
            {jsonError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-mono mb-3 flex items-start gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="break-all">{jsonError}</span>
              </div>
            )}

            {/* Textarea Code Editor */}
            <div className="flex-1 relative mb-4">
              <textarea 
                value={jsonInputText}
                onChange={(e) => {
                  setJsonInputText(e.target.value);
                  setJsonError(null);
                }}
                rows={14}
                placeholder='{\n  "name": "My Team",\n  "rootAgentId": "root-1",\n  "agents": { ... }\n}'
                className="w-full h-full bg-neutral-900 text-emerald-400 font-mono text-xs p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <button
                onClick={handleCopyJson}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply JSON Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: JSON Format Specification & Sample Schema */}
      {showSampleSchema && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  ARCHI Team JSON Format Specification
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Use this standard JSON format to structure agent nodes, parent-child delegation links, persona names, and responsibilities.
                </p>
              </div>
              <button 
                onClick={() => setShowSampleSchema(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-neutral-900 text-emerald-400 font-mono text-xs p-4 rounded-xl leading-relaxed mb-4">
              <pre>{JSON.stringify({
  name: "ARCHI Enterprise Cloud Architecture",
  rootAgentId: "root-1",
  agents: {
    "root-1": {
      id: "root-1",
      parentId: null,
      roleName: "Head Architect",
      personName: "Alice",
      responsibilities: "Overall system topology, governance, and master blueprint.",
      status: "idle",
      childrenIds: ["lead-fe", "lead-be"]
    },
    "lead-fe": {
      id: "lead-fe",
      parentId: "root-1",
      roleName: "Frontend & UI/UX Lead",
      personName: "Bob",
      responsibilities: "Client architecture, component libraries, and visual design.",
      status: "idle",
      childrenIds: ["spec-react"]
    },
    "spec-react": {
      id: "spec-react",
      parentId: "lead-fe",
      roleName: "React & State Specialist",
      personName: "Frank",
      responsibilities: "Client state management and interactive UI components.",
      status: "idle",
      childrenIds: []
    },
    "lead-be": {
      id: "lead-be",
      parentId: "root-1",
      roleName: "Backend Services Lead",
      personName: "Carol",
      responsibilities: "API routes, microservice boundaries, and business logic.",
      status: "idle",
      childrenIds: []
    }
  }
}, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <button
                onClick={() => {
                  const sampleJson = JSON.stringify({
                    name: "ARCHI Enterprise Cloud Architecture",
                    rootAgentId: "root-1",
                    agents: {
                      "root-1": {
                        id: "root-1",
                        parentId: null,
                        roleName: "Head Architect",
                        personName: "Alice",
                        responsibilities: "Overall system topology, governance, and master blueprint.",
                        status: "idle",
                        childrenIds: ["lead-fe", "lead-be"]
                      },
                      "lead-fe": {
                        id: "lead-fe",
                        parentId: "root-1",
                        roleName: "Frontend & UI/UX Lead",
                        personName: "Bob",
                        responsibilities: "Client architecture, component libraries, and visual design.",
                        status: "idle",
                        childrenIds: []
                      },
                      "lead-be": {
                        id: "lead-be",
                        parentId: "root-1",
                        roleName: "Backend Services Lead",
                        personName: "Carol",
                        responsibilities: "API routes, microservice boundaries, and business logic.",
                        status: "idle",
                        childrenIds: []
                      }
                    }
                  }, null, 2);
                  navigator.clipboard.writeText(sampleJson);
                  alert('Copied sample JSON specification to clipboard!');
                }}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Sample JSON</span>
              </button>

              <button
                onClick={() => setShowSampleSchema(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
