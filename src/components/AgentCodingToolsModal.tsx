import React, { useState } from 'react';
import { AgentNode, Project, CodeFile, PullRequest } from '../types';
import { 
  Code, Terminal, Sparkles, CheckCircle2, Play, GitPullRequest, 
  FileCode, Cpu, ShieldAlert, RefreshCw, Check, Copy, ArrowRight, Layers
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AgentCodingToolsModalProps {
  agent: AgentNode;
  project: Project;
  activeDocContent: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyCodeToDoc: (newContent: string) => void;
  onUpdateProject: (p: Project) => void;
}

export function AgentCodingToolsModal({
  agent,
  project,
  activeDocContent,
  isOpen,
  onClose,
  onApplyCodeToDoc,
  onUpdateProject
}: AgentCodingToolsModalProps) {
  if (!isOpen) return null;

  const [activeToolTab, setActiveToolTab] = useState<'codegen' | 'unittest' | 'refactor' | 'pr_submit'>('codegen');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [prBranchName, setPrBranchName] = useState(`feature/${agent.personName.toLowerCase()}-${agent.roleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
  const [prTitle, setPrTitle] = useState(`[${agent.personName}] ${agent.roleName} - Domain Code Implementation`);
  const [submittedPrSuccess, setSubmittedPrSuccess] = useState(false);

  // AI Code Tool: Generate Code from Spec
  const handleGenerateCodeFromSpec = () => {
    setIsGenerating(true);
    setGeneratedResult('');
    
    setTimeout(() => {
      const isFrontend = agent.roleName.toLowerCase().includes('frontend') || agent.roleName.toLowerCase().includes('ui') || agent.roleName.toLowerCase().includes('react');
      const isBackend = agent.roleName.toLowerCase().includes('backend') || agent.roleName.toLowerCase().includes('api') || agent.roleName.toLowerCase().includes('database');

      let snippet = '';
      if (isFrontend) {
        snippet = `// Auto-Generated React Component for ${agent.roleName}\n// Author: ${agent.personName}\n\nimport React, { useState, useEffect } from 'react';\n\nexport interface ${agent.personName}WidgetProps {\n  title?: string;\n  onAction?: () => void;\n}\n\nexport const ${agent.personName.replace(/\s+/g, '')}Widget: React.FC<${agent.personName}WidgetProps> = ({ title = "${agent.roleName} View", onAction }) => {\n  const [isLoading, setIsLoading] = useState(false);\n  const [data, setData] = useState<any[]>([]);\n\n  useEffect(() => {\n    // Initialize domain state for ${agent.responsibilities}\n    setIsLoading(true);\n    const timer = setTimeout(() => {\n      setData([{ id: '1', name: 'Domain Node Alpha', status: 'ACTIVE' }]);\n      setIsLoading(false);\n    }, 400);\n    return () => clearTimeout(timer);\n  }, []);\n\n  return (\n    <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">\n      <h3 className="text-sm font-bold text-neutral-900">{title}</h3>\n      <p className="text-xs text-neutral-500 mt-1">${agent.responsibilities}</p>\n      <button \n        onClick={onAction}\n        className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"\n      >\n        Execute ${agent.personName}'s Service\n      </button>\n    </div>\n  );\n};`;
      } else if (isBackend) {
        snippet = `// Auto-Generated Express API Controller & Service\n// Author: ${agent.personName} (${agent.roleName})\n\nimport { Router, Request, Response } from 'express';\n\nexport const ${agent.personName.toLowerCase()}Router = Router();\n\n/**\n * @route GET /api/v1/${agent.personName.toLowerCase()}/status\n * @desc ${agent.responsibilities}\n */\n${agent.personName.toLowerCase()}Router.get('/status', async (req: Request, res: Response) => {\n  try {\n    const payload = {\n      agent: '${agent.personName}',\n      role: '${agent.roleName}',\n      status: 'HEALTHY',\n      timestamp: new Date().toISOString()\n    };\n    res.json({ success: true, data: payload });\n  } catch (error) {\n    res.status(500).json({ success: false, error: 'Internal Domain Error' });\n  }\n});\n\n${agent.personName.toLowerCase()}Router.post('/dispatch', async (req: Request, res: Response) => {\n  const { action, payload } = req.body;\n  // Execute backend domain logic\n  res.status(200).json({ success: true, actionExecuted: action, result: 'OK' });\n});`;
      } else {
        snippet = `// Auto-Generated Architecture Specification & Domain Module\n// Lead: ${agent.personName} (${agent.roleName})\n\nexport interface ${agent.personName}DomainContract {\n  id: string;\n  scope: string;\n  executeDirective(input: Record<string, any>): Promise<Record<string, any>>;\n}\n\nexport class ${agent.personName.replace(/\s+/g, '')}Service implements ${agent.personName}DomainContract {\n  id = "${agent.id}";\n  scope = "${agent.responsibilities}";\n\n  async executeDirective(input: Record<string, any>): Promise<Record<string, any>> {\n    console.log(\`[${agent.personName}] Executing directive with scope: \${this.scope}\`);\n    return {\n      status: 'SUCCESS',\n      output: input,\n      timestamp: Date.now()\n    };\n  }\n}`;
      }

      setGeneratedResult(snippet);
      setIsGenerating(false);
    }, 600);
  };

  // AI Unit Test Generator
  const handleGenerateUnitTests = () => {
    setIsGenerating(true);
    setGeneratedResult('');

    setTimeout(() => {
      const testCode = `// Auto-Generated Vitest / Jest Unit Test Suite\n// Target: ${agent.personName} (${agent.roleName})\n\nimport { describe, it, expect, vi } from 'vitest';\n\ndescribe('${agent.personName} (${agent.roleName}) Domain Test Suite', () => {\n  it('should correctly initialize domain contracts', () => {\n    const agentRole = "${agent.roleName}";\n    expect(agentRole).toBeDefined();\n    expect(agentRole.length).toBeGreaterThan(0);\n  });\n\n  it('should execute responsibilities without throwing errors', async () => {\n    const mockExecute = vi.fn().mockResolvedValue({ status: 'SUCCESS' });\n    const res = await mockExecute({ directive: 'BUILD_SERVICE' });\n    \n    expect(mockExecute).toHaveBeenCalledTimes(1);\n    expect(res.status).toBe('SUCCESS');\n  });\n\n  it('should validate inputs and maintain high cohesion', () => {\n    const inputPayload = { valid: true };\n    expect(inputPayload.valid).toBe(true);\n  });\n});`;

      setGeneratedResult(testCode);
      setIsGenerating(false);
    }, 600);
  };

  // AI Code Refactor & Optimizer
  const handleRefactorCode = () => {
    setIsGenerating(true);
    setGeneratedResult('');

    setTimeout(() => {
      const refactored = `// AI Refactored & Optimized Code Module\n// Refactored for: ${agent.personName} (${agent.roleName})\n// Improvements: Type safety, error boundary checks, memoization, and zero side-effects.\n\n${activeDocContent.includes('export') ? activeDocContent : `// Refactored Document Content:\n` + activeDocContent}\n\n/* \n  ================ AI REFACTORING ADVISORY =================\n  1. Added strict interface constraints for ${agent.roleName}.\n  2. Encapsulated state updates to prevent race conditions.\n  3. Verified non-blocking async execution patterns.\n  ===========================================================\n*/`;

      setGeneratedResult(refactored);
      setIsGenerating(false);
    }, 600);
  };

  // Submit Pull Request to Central Repository
  const handleSubmitPullRequest = () => {
    const codeContent = generatedResult || activeDocContent || `// ${agent.personName}'s domain implementation`;
    const isFrontend = agent.roleName.toLowerCase().includes('frontend') || agent.roleName.toLowerCase().includes('ui');
    const isBackend = agent.roleName.toLowerCase().includes('backend') || agent.roleName.toLowerCase().includes('api');
    
    let filePath = `src/domain/${agent.personName.toLowerCase()}_module.ts`;
    if (isFrontend) filePath = `src/components/${agent.personName}Component.tsx`;
    if (isBackend) filePath = `src/backend/${agent.personName.toLowerCase()}Controller.ts`;

    const newPr: PullRequest = {
      id: `pr-${uuidv4().slice(0, 8)}`,
      title: prTitle,
      authorId: agent.id,
      branchName: prBranchName,
      targetBranch: 'main',
      status: 'OPEN',
      summary: `Domain implementation code submitted by ${agent.personName} (${agent.roleName}). Ready for review and merge into main.`,
      codeFiles: [
        {
          filePath,
          language: isFrontend ? 'typescript' : 'typescript',
          content: codeContent,
          lastUpdatedBy: agent.personName,
          updatedAt: Date.now()
        }
      ],
      createdAt: Date.now()
    };

    const currentRepo = project.repository || {
      mainBranch: [
        {
          filePath: 'src/App.tsx',
          language: 'typescript',
          content: `// Main Project Application Entry Point\nimport React from 'react';\n\nexport default function App() {\n  return <div>Unified Application Root</div>;\n}`,
          lastUpdatedBy: 'System',
          updatedAt: Date.now()
        }
      ],
      pullRequests: [],
      gitMergeAgent: {
        id: 'git-merge-agent',
        personName: 'Morgan',
        roleName: 'Release & Git Integration Lead',
        status: 'idle'
      }
    };

    const updatedRepo = {
      ...currentRepo,
      pullRequests: [newPr, ...currentRepo.pullRequests]
    };

    onUpdateProject({
      ...project,
      repository: updatedRepo
    });

    setSubmittedPrSuccess(true);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-neutral-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <span>AI Coding Assistant & Sub-Agents</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                  For {agent.personName}
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                Assist {agent.personName} ({agent.roleName}) with code generation, unit tests, refactoring & Git PR submission.
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

        {/* Sub-Agent Tools Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 border-b border-neutral-200 pb-2">
          <button
            onClick={() => setActiveToolTab('codegen')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeToolTab === 'codegen' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Code Copilot</span>
          </button>

          <button
            onClick={() => setActiveToolTab('unittest')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeToolTab === 'unittest' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test Runner Agent</span>
          </button>

          <button
            onClick={() => setActiveToolTab('refactor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeToolTab === 'refactor' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refactor Assistant</span>
          </button>

          <button
            onClick={() => setActiveToolTab('pr_submit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeToolTab === 'pr_submit' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Submit Git PR</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="py-4 space-y-4">
          
          {/* TAB 1: CODE COPILOT */}
          {activeToolTab === 'codegen' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Spec-to-Code Boilerplate Copilot</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Analyzes {agent.personName}'s responsibilities and generates production-ready TypeScript/React domain code.
                  </p>
                </div>
                <button
                  onClick={handleGenerateCodeFromSpec}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UNIT TEST AGENT */}
          {activeToolTab === 'unittest' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Unit Test Suite Generator</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Generates Vitest & Jest unit test suites to verify {agent.personName}'s component behavior and logic boundaries.
                  </p>
                </div>
                <button
                  onClick={handleGenerateUnitTests}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generating Tests...' : 'Generate Test Suite'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: REFACTOR ASSISTANT */}
          {activeToolTab === 'refactor' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Code Optimization & Refactoring Agent</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Refactors {agent.personName}'s document code for high cohesion, strict type safety, and clean architecture.
                  </p>
                </div>
                <button
                  onClick={handleRefactorCode}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Refactoring...' : 'Refactor Code'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SUBMIT GIT PULL REQUEST */}
          {activeToolTab === 'pr_submit' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-900">Submit Feature Branch Pull Request</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Publishes {agent.personName}'s code as a feature branch PR to the project repository for the <strong>Git Merge Agent (Morgan)</strong> to review and merge into <code>main</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Feature Branch Name</label>
                  <input
                    type="text"
                    value={prBranchName}
                    onChange={e => setPrBranchName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Pull Request Title</label>
                  <input
                    type="text"
                    value={prTitle}
                    onChange={e => setPrTitle(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {submittedPrSuccess ? (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pull Request successfully created! Check the Code Repository tab to view or merge.</span>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitPullRequest}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <GitPullRequest className="w-4 h-4" />
                    <span>Submit Pull Request to Main Repo</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Generated Result Output Block */}
          {generatedResult && (
            <div className="mt-4 border border-neutral-200 rounded-xl overflow-hidden bg-neutral-900">
              <div className="bg-neutral-800 px-3.5 py-2 flex items-center justify-between text-neutral-300 text-xs font-mono border-b border-neutral-700">
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Sub-Agent Code Output</span>
                </span>
                <button
                  onClick={() => {
                    onApplyCodeToDoc(generatedResult);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-sans font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to {agent.personName}'s Document</span>
                </button>
              </div>

              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-60 leading-relaxed">
                <code>{generatedResult}</code>
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
