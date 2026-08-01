import React, { useState } from 'react';
import { Project, CodeFile, PullRequest, AgentNode } from '../types';
import { 
  GitBranch, GitMerge, GitPullRequest, FileCode, CheckCircle2, 
  AlertTriangle, Clock, ArrowLeft, Plus, Play, Cpu, Sparkles, 
  Trash2, Eye, ShieldCheck, Check, Copy, Code, Layers, FileText
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CodeRepositoryWorkspaceProps {
  project: Project;
  onUpdateProject: (p: Project) => void;
  onBackToWorkspace: () => void;
}

export function CodeRepositoryWorkspace({
  project,
  onUpdateProject,
  onBackToWorkspace
}: CodeRepositoryWorkspaceProps) {
  // Ensure default repository state if undefined
  const defaultRepo = {
    mainBranch: [
      {
        filePath: 'src/App.tsx',
        language: 'typescript',
        content: `// Unified Application Entry Point\nimport React from 'react';\nimport { Header } from './components/Header';\nimport { MainDashboard } from './components/MainDashboard';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-neutral-50 text-neutral-900">\n      <Header title="${project.name}" />\n      <main className="max-w-7xl mx-auto p-6">\n        <MainDashboard />\n      </main>\n    </div>\n  );\n}`,
        lastUpdatedBy: 'Alice (Head Architect)',
        updatedAt: Date.now() - 3600000
      },
      {
        filePath: 'src/backend/server.ts',
        language: 'typescript',
        content: `// Express API Gateway Server\nimport express from 'express';\n\nconst app = express();\napp.use(express.json());\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', project: '${project.name}' });\n});\n\nexport default app;`,
        lastUpdatedBy: 'Carol (Backend Lead)',
        updatedAt: Date.now() - 7200000
      },
      {
        filePath: 'src/database/schema.sql',
        language: 'sql',
        content: `-- Core Database Schema\nCREATE TABLE IF NOT EXISTS users (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  email VARCHAR(255) UNIQUE NOT NULL,\n  role VARCHAR(50) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`,
        lastUpdatedBy: 'Grace (Database Engineer)',
        updatedAt: Date.now() - 10800000
      }
    ],
    pullRequests: [
      {
        id: 'pr-demo-1',
        title: '[Bob] Frontend UI Navigation & Component Library',
        authorId: Object.keys(project.agents)[1] || project.rootAgentId,
        branchName: 'feature/bob-frontend-ui',
        targetBranch: 'main',
        status: 'OPEN' as const,
        summary: 'Implements responsive navigation bar, Tailwind layout grid, and accessible component library.',
        codeFiles: [
          {
            filePath: 'src/components/Header.tsx',
            language: 'typescript',
            content: `import React from 'react';\n\nexport const Header = ({ title }: { title: string }) => (\n  <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">\n    <h1 className="text-lg font-bold text-neutral-900">{title}</h1>\n    <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-full">v1.0.0</span>\n  </header>\n);`,
            lastUpdatedBy: 'Bob (Frontend Lead)',
            updatedAt: Date.now() - 1800000
          }
        ],
        createdAt: Date.now() - 1800000
      },
      {
        id: 'pr-demo-2',
        title: '[Carol] Express Router & Middleware Layer',
        authorId: Object.keys(project.agents)[2] || project.rootAgentId,
        branchName: 'feature/carol-backend-api',
        targetBranch: 'main',
        status: 'OPEN' as const,
        summary: 'Adds router modules, JWT middleware, and centralized error logging handlers.',
        codeFiles: [
          {
            filePath: 'src/backend/routes/apiRouter.ts',
            language: 'typescript',
            content: `import { Router } from 'express';\n\nexport const apiRouter = Router();\n\napiRouter.get('/version', (req, res) => {\n  res.json({ version: '1.0.0-beta', status: 'ACTIVE' });\n});`,
            lastUpdatedBy: 'Carol (Backend Lead)',
            updatedAt: Date.now() - 3600000
          }
        ],
        createdAt: Date.now() - 3600000
      }
    ],
    gitMergeAgent: {
      id: 'git-merge-agent',
      personName: 'Morgan',
      roleName: 'Release & Git Integration Lead',
      status: 'idle' as const
    }
  };

  const repository = project.repository || defaultRepo;

  // View States
  const [activeTab, setActiveTab] = useState<'pull_requests' | 'main_repository' | 'commit_history'>('pull_requests');
  const [selectedPrId, setSelectedPrId] = useState<string>(repository.pullRequests[0]?.id || '');
  const [selectedFilePath, setSelectedFilePath] = useState<string>(repository.mainBranch[0]?.filePath || '');
  
  // AI Git Merge Agent running state
  const [isMergingPrId, setIsMergingPrId] = useState<string | null>(null);
  const [isMergeAgentRunning, setIsMergeAgentRunning] = useState<boolean>(false);
  const [mergeLogs, setMergeLogs] = useState<string[]>([]);

  // New Code File Modal State
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState('src/common/types.ts');
  const [newFileContent, setNewFileContent] = useState('export interface AppConfig {\n  env: string;\n}');

  // Selected PR object
  const selectedPr = repository.pullRequests.find(pr => pr.id === selectedPrId) || repository.pullRequests[0];
  // Selected Code File object in main branch
  const selectedCodeFile = repository.mainBranch.find(f => f.filePath === selectedFilePath) || repository.mainBranch[0];

  // Merge a single PR into main
  const handleMergePr = (prToMerge: PullRequest) => {
    setIsMergingPrId(prToMerge.id);

    setTimeout(() => {
      // Add or update code files in main branch
      const updatedMainBranch = [...repository.mainBranch];
      
      prToMerge.codeFiles.forEach(newFile => {
        const existingIdx = updatedMainBranch.findIndex(f => f.filePath === newFile.filePath);
        if (existingIdx >= 0) {
          updatedMainBranch[existingIdx] = {
            ...newFile,
            updatedAt: Date.now(),
            lastUpdatedBy: `Morgan (Git Merge Agent) via ${prToMerge.branchName}`
          };
        } else {
          updatedMainBranch.push({
            ...newFile,
            updatedAt: Date.now(),
            lastUpdatedBy: `Morgan (Git Merge Agent) via ${prToMerge.branchName}`
          });
        }
      });

      // Update PR status to MERGED
      const updatedPrs = repository.pullRequests.map(pr => 
        pr.id === prToMerge.id 
          ? { ...pr, status: 'MERGED' as const, mergedAt: Date.now(), mergedBy: 'Morgan (Git Merge Agent)' }
          : pr
      );

      const updatedRepo = {
        ...repository,
        mainBranch: updatedMainBranch,
        pullRequests: updatedPrs
      };

      onUpdateProject({
        ...project,
        repository: updatedRepo
      });

      setIsMergingPrId(null);
    }, 800);
  };

  // Run AI Git Merge Agent across all open PRs
  const handleRunGitMergeAgent = () => {
    setIsMergeAgentRunning(true);
    setMergeLogs([
      '[Git Merge Agent Morgan] Initializing multi-branch conflict analysis...',
      '[Git Merge Agent Morgan] Fetching open branch pull requests...'
    ]);

    setTimeout(() => {
      setMergeLogs(prev => [...prev, '[Git Merge Agent Morgan] Checking AST syntax & interface port compatibility...']);
    }, 600);

    setTimeout(() => {
      setMergeLogs(prev => [...prev, '[Git Merge Agent Morgan] Resolving minor import conflicts across domain slices...']);
    }, 1200);

    setTimeout(() => {
      // Merge all OPEN pull requests
      const updatedMainBranch = [...repository.mainBranch];
      const openPrs = repository.pullRequests.filter(pr => pr.status === 'OPEN');

      openPrs.forEach(pr => {
        pr.codeFiles.forEach(newFile => {
          const existingIdx = updatedMainBranch.findIndex(f => f.filePath === newFile.filePath);
          if (existingIdx >= 0) {
            updatedMainBranch[existingIdx] = {
              ...newFile,
              updatedAt: Date.now(),
              lastUpdatedBy: `Morgan (Git Merge Agent) via ${pr.branchName}`
            };
          } else {
            updatedMainBranch.push({
              ...newFile,
              updatedAt: Date.now(),
              lastUpdatedBy: `Morgan (Git Merge Agent) via ${pr.branchName}`
            });
          }
        });
      });

      const updatedPrs = repository.pullRequests.map(pr => ({
        ...pr,
        status: 'MERGED' as const,
        mergedAt: Date.now(),
        mergedBy: 'Morgan (Git Merge Agent)'
      }));

      const updatedRepo = {
        ...repository,
        mainBranch: updatedMainBranch,
        pullRequests: updatedPrs
      };

      onUpdateProject({
        ...project,
        repository: updatedRepo
      });

      setMergeLogs(prev => [
        ...prev,
        `[Git Merge Agent Morgan] SUCCESS: Merged ${openPrs.length} pull requests into main branch seamlessly!`
      ]);
      setIsMergeAgentRunning(false);
    }, 2000);
  };

  // Create new code file in main branch
  const handleCreateCodeFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;

    const newFile: CodeFile = {
      filePath: newFilePath.trim(),
      language: newFilePath.endsWith('.sql') ? 'sql' : 'typescript',
      content: newFileContent,
      lastUpdatedBy: 'Manual Repository Edit',
      updatedAt: Date.now()
    };

    const updatedMainBranch = [...repository.mainBranch, newFile];
    const updatedRepo = {
      ...repository,
      mainBranch: updatedMainBranch
    };

    onUpdateProject({
      ...project,
      repository: updatedRepo
    });

    setSelectedFilePath(newFile.filePath);
    setShowNewFileModal(false);
    setNewFilePath('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 font-sans">
      
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToWorkspace}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors"
            title="Back to Agent Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-600" />
              <span>Unified Code Repository & Branch Merges</span>
            </h1>
            <p className="text-xs text-neutral-500">
              Manage agent branch pull requests, side-by-side code diffs, and AI Git Merge integrations.
            </p>
          </div>
        </div>

        {/* Dedicated Git Merge Agent Status Card */}
        <div className="flex items-center gap-3 bg-neutral-900 text-white p-2.5 px-4 rounded-xl shadow-sm border border-neutral-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            M
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span>Morgan</span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                Git Merge Agent
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Release & Integration Manager</p>
          </div>

          <button
            onClick={handleRunGitMergeAgent}
            disabled={isMergeAgentRunning || repository.pullRequests.filter(pr => pr.status === 'OPEN').length === 0}
            className="ml-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isMergeAgentRunning ? 'Merging...' : 'Run Git Merge Agent'}</span>
          </button>
        </div>
      </header>

      {/* Navigation Mode Tabs */}
      <div className="bg-white border-b border-neutral-200/80 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pull_requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pull_requests' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Pull Requests ({repository.pullRequests.filter(p => p.status === 'OPEN').length} Open)</span>
          </button>

          <button
            onClick={() => setActiveTab('main_repository')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'main_repository' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Unified Main Codebase ({repository.mainBranch.length} Files)</span>
          </button>

          <button
            onClick={() => setActiveTab('commit_history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'commit_history' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Git Merge Log</span>
          </button>
        </div>

        {activeTab === 'main_repository' && (
          <button
            onClick={() => setShowNewFileModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Code File</span>
          </button>
        )}
      </div>

      {/* Merge Agent Running Logs Banner */}
      {mergeLogs.length > 0 && (
        <div className="bg-neutral-900 border-b border-neutral-800 p-3 text-xs font-mono text-indigo-300 space-y-1 max-h-32 overflow-y-auto">
          {mergeLogs.map((log, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-neutral-500">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= TAB 1: PULL REQUESTS & BRANCH DIFFS ================= */}
        {activeTab === 'pull_requests' && (
          <div className="flex-1 flex overflow-hidden">
            {/* PRs Left Sidebar */}
            <div className="w-80 bg-white border-r border-neutral-200 flex flex-col shrink-0">
              <div className="p-3 border-b border-neutral-100 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Agent Feature Branches ({repository.pullRequests.length})
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {repository.pullRequests.map(pr => {
                  const author = project.agents[pr.authorId];
                  return (
                    <button
                      key={pr.id}
                      onClick={() => setSelectedPrId(pr.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedPrId === pr.id 
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-xs' 
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold font-mono text-neutral-500 truncate">
                          {pr.branchName}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          pr.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {pr.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-neutral-900 line-clamp-1">{pr.title}</p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Author: <strong>{author?.personName || 'Agent'}</strong> ({author?.roleName || 'Lead'})
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PR Details & Code Diff Viewer */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-50 overflow-y-auto p-6 space-y-6">
              {selectedPr ? (
                <>
                  {/* PR Overview Header */}
                  <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
                            PR #{selectedPr.id}
                          </span>
                          <span className="text-xs font-mono text-neutral-500">
                            {selectedPr.branchName} → {selectedPr.targetBranch}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-neutral-900 mt-1">{selectedPr.title}</h2>
                      </div>

                      {selectedPr.status === 'OPEN' ? (
                        <button
                          onClick={() => handleMergePr(selectedPr)}
                          disabled={isMergingPrId === selectedPr.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <GitMerge className="w-4 h-4" />
                          <span>{isMergingPrId === selectedPr.id ? 'Merging Branch...' : '1-Click Merge into Main'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Merged by {selectedPr.mergedBy || 'Morgan'}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                      {selectedPr.summary}
                    </p>
                  </div>

                  {/* Code Diff Block */}
                  <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
                    <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-700">
                      <span className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-indigo-600" />
                        <span>Code Changes in Branch ({selectedPr.codeFiles.length} File)</span>
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Target: {selectedPr.codeFiles[0]?.filePath}
                      </span>
                    </div>

                    <div className="p-4 bg-neutral-900 font-mono text-xs overflow-x-auto">
                      <div className="text-neutral-500 border-b border-neutral-800 pb-2 mb-2">
                        --- a/{selectedPr.codeFiles[0]?.filePath || 'file.ts'}\n+++ b/{selectedPr.codeFiles[0]?.filePath || 'file.ts'}
                      </div>
                      <pre className="text-emerald-400 leading-relaxed">
                        <code>{selectedPr.codeFiles[0]?.content}</code>
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-neutral-400 py-16">
                  <GitPullRequest className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm font-bold text-neutral-700">No Pull Requests Submitted Yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Submit PRs using the AI Coding Assistant in individual agent workspaces.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: UNIFIED MAIN CODEBASE EXPLORER ================= */}
        {activeTab === 'main_repository' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Main Repo File Tree */}
            <div className="w-72 bg-white border-r border-neutral-200 flex flex-col shrink-0">
              <div className="p-3 border-b border-neutral-100 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Main Repository Files
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {repository.mainBranch.map(file => (
                  <button
                    key={file.filePath}
                    onClick={() => setSelectedFilePath(file.filePath)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                      selectedFilePath === file.filePath
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="truncate">{file.filePath}</span>
                    <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </button>
                ))}
              </div>
            </div>

            {/* Code View Editor */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-900 overflow-hidden">
              <div className="bg-neutral-800 px-4 py-3 flex items-center justify-between text-xs font-mono text-neutral-300 border-b border-neutral-700">
                <span className="font-bold text-indigo-400">{selectedCodeFile?.filePath}</span>
                <span className="text-[11px] text-neutral-400">
                  Last Updated by: <strong>{selectedCodeFile?.lastUpdatedBy}</strong>
                </span>
              </div>

              <div className="flex-1 p-4 overflow-auto font-mono text-xs text-neutral-200 leading-relaxed">
                <pre>
                  <code>{selectedCodeFile?.content}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: COMMIT HISTORY & AUDIT LOG ================= */}
        {activeTab === 'commit_history' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Merged Git Commit History & Release Audit
            </h2>

            <div className="space-y-3">
              {repository.pullRequests.map(pr => (
                <div key={pr.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <GitMerge className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">{pr.title}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Branch: <code>{pr.branchName}</code> • Status: <strong>{pr.status}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {new Date(pr.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* New Code File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-3">Create New Code File</h3>
            <form onSubmit={handleCreateCodeFile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">File Path</label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={e => setNewFilePath(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Initial Content</label>
                <textarea
                  value={newFileContent}
                  onChange={e => setNewFileContent(e.target.value)}
                  className="w-full bg-neutral-900 text-emerald-400 font-mono border border-neutral-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 h-32"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
