import React, { useState } from 'react';
import { PendingApproval, AgentNode } from '../types';
import { X, Check, GitCompare, ArrowRight, ShieldCheck, FileText, Undo2 } from 'lucide-react';

interface DiffModalProps {
  pendingApproval: PendingApproval;
  subordinateAgent?: AgentNode;
  supervisorAgent?: AgentNode;
  onApprove: () => void;
  onRequestRevision: () => void;
  onClose: () => void;
  isApproving?: boolean;
  isRequestingRevision?: boolean;
}

export function DiffModal({
  pendingApproval,
  subordinateAgent,
  supervisorAgent,
  onApprove,
  onRequestRevision,
  onClose,
  isApproving = false,
  isRequestingRevision = false
}: DiffModalProps) {
  const isBusy = isApproving || isRequestingRevision;
  const [viewMode, setViewMode] = useState<'unified' | 'side-by-side'>('side-by-side');

  const diffLines = (pendingApproval.diffText || '').split('\n');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-neutral-900 text-white p-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xs">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Architecture Review & Diff Approval</h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Pending Approval
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Subordinate <span className="text-white font-semibold">{subordinateAgent?.personName || pendingApproval.authorId}</span> ({subordinateAgent?.roleName}) submitting slice to <span className="text-white font-semibold">{supervisorAgent?.personName || 'Supervisor'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-neutral-800 p-1 rounded-xl flex items-center gap-1 border border-neutral-700">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'side-by-side' ? 'bg-indigo-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'unified' ? 'bg-indigo-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Unified Diff
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-900 font-mono text-xs text-neutral-200">
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Supervisor Baseline */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3 text-neutral-400 font-sans text-xs">
                  <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-neutral-500" /> Current Supervisor Baseline
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">{supervisorAgent?.roleName || 'Supervisor'}</span>
                </div>
                <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-neutral-400">
                  {supervisorAgent?.decisions || 'Master Plan Strategy & Architectural Context'}
                </div>
              </div>

              {/* Subordinate Proposed Spec */}
              <div className="bg-neutral-950 border border-emerald-900/40 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2 mb-3 font-sans text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" /> Proposed Subordinate Specification
                  </span>
                  <span className="text-[10px] text-emerald-500/80 font-mono">{subordinateAgent?.roleName}</span>
                </div>
                <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-100">
                  {pendingApproval.content}
                </div>
              </div>
            </div>
          ) : (
            /* Unified Textual Diff */
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs leading-relaxed overflow-x-auto">
              <div className="border-b border-neutral-800 pb-2 mb-3 text-neutral-400 font-sans text-xs font-bold">
                Unified Line-by-Line Textual Diff
              </div>
              <div className="space-y-0.5">
                {diffLines.map((line, idx) => {
                  let bg = 'text-neutral-400';
                  if (line.startsWith('+')) bg = 'bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-sm block font-semibold';
                  else if (line.startsWith('-')) bg = 'bg-red-950/60 text-red-400 px-2 py-0.5 rounded-sm block font-semibold line-through';
                  else if (line.startsWith('@@')) bg = 'text-indigo-400 font-bold py-1 block';

                  return (
                    <div key={idx} className={bg}>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Approving this slice will merge {subordinateAgent?.personName}'s specification into the supervisor's architecture context.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Close & Review Later
            </button>
            <button
              onClick={onRequestRevision}
              disabled={isBusy}
              className="border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Undo2 className="w-4 h-4" />
              {isRequestingRevision ? 'Sending Back...' : 'Request Revision'}
            </button>
            <button
              onClick={onApprove}
              disabled={isBusy}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isApproving ? 'Approving & Merging...' : 'Approve & Merge Slice'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
