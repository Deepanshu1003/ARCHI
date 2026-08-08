import React, { useCallback, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import {
  X, FileText, Globe, Lock, CheckCircle2, AlertTriangle, Copy, Download, RefreshCw, Send,
} from 'lucide-react';
import * as api from '../api/client';
import { BlueprintResponse, WireBlueprintSection } from '../api/types';
import { cn } from '../utils';

interface BuildPlanModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onOpenAgent?: (agentId: string) => void;
}

type Tab = 'plan' | 'spec';

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function SectionCard({
  section,
  onOpenAgent,
}: {
  section: WireBlueprintSection;
  onOpenAgent?: (agentId: string) => void;
}) {
  return (
    <div
      className="border border-neutral-200 rounded-2xl bg-white overflow-hidden"
      style={{ marginLeft: `${Math.min(section.depth, 4) * 16}px` }}
    >
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200/70 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            onClick={() => onOpenAgent?.(section.agentId)}
            className="text-sm font-bold text-neutral-900 hover:text-indigo-600 transition-colors text-left"
          >
            {section.personName} — {section.roleName}
          </button>
          <p className="text-xs text-neutral-500 mt-0.5">
            {section.responsibilities || 'No responsibilities recorded.'}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
            section.isFinal
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200',
          )}
        >
          {section.statusLabel}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {section.principles.trim() && (
          <details className="group">
            <summary className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 cursor-pointer">
              Principles — the rules this agent must work within
            </summary>
            <div className="prose prose-xs max-w-none mt-2 text-neutral-700">
              <Markdown>{section.principles}</Markdown>
            </div>
          </details>
        )}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Development Plan {section.planVersion > 0 && `· v${section.planVersion}`}
          </span>
          {section.hasPlan ? (
            <div className="prose prose-sm max-w-none mt-1.5 text-neutral-800">
              <Markdown>{section.plan}</Markdown>
            </div>
          ) : (
            <p className="text-xs text-neutral-400 italic mt-1.5">
              No plan yet — this agent has not drafted or been delegated one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function BuildPlanModal({ projectId, projectName, onClose, onOpenAgent }: BuildPlanModalProps) {
  const [tab, setTab] = useState<Tab>('plan');
  const [blueprint, setBlueprint] = useState<BlueprintResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setBlueprint(await api.getBlueprint(projectId));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      setBlueprint(await api.publishBlueprint(projectId));
      setError(null);
      setTab('spec');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsPublishing(false);
    }
  };

  const isFinal = blueprint?.isFinal ?? false;
  const spec = blueprint?.publishedSpec ?? '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-neutral-100 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-100 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Project Blueprint
            </span>
            <h2 className="text-2xl font-display font-bold text-neutral-900 mt-1">{projectName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {blueprint && (
          <div
            className={cn(
              'mx-6 mt-4 px-4 py-3 rounded-2xl border flex items-start gap-2.5 text-xs shrink-0',
              isFinal
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800',
            )}
          >
            {isFinal ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {isFinal ? 'Build plan is final — every agent is approved.' : 'Draft — the build plan is not final yet.'}
              </p>
              {!isFinal && blueprint.pendingAgents.length > 0 && (
                <p className="mt-0.5">
                  Waiting on: <span className="font-semibold">{blueprint.pendingAgents.join(', ')}</span>. A
                  report is done once its supervisor approves it; the root is done once it holds the merged plan.
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs shrink-0">
            {error}
          </div>
        )}

        <div className="px-6 pt-4 flex items-center gap-1 shrink-0">
          <button
            onClick={() => setTab('plan')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors',
              tab === 'plan' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:bg-neutral-100',
            )}
          >
            <FileText className="w-3.5 h-3.5" /> Build Plan by Team
          </button>
          <button
            onClick={() => setTab('spec')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors',
              tab === 'spec' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:bg-neutral-100',
            )}
          >
            {blueprint?.isPublished ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            Public Domain Spec
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && !blueprint ? (
            <p className="text-xs text-neutral-400">Loading the blueprint…</p>
          ) : tab === 'plan' ? (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                One section per agent, in reporting order. Each agent owns two documents:{' '}
                <span className="font-semibold text-neutral-700">Principles</span> (the rules and inherited
                context it must respect) and <span className="font-semibold text-neutral-700">Development
                Plan</span> (the work it owns). This view stitches those plans into the project-wide build plan.
              </p>
              {blueprint?.sections.map((section) => (
                <SectionCard key={section.agentId} section={section} onOpenAgent={onOpenAgent} />
              ))}
            </div>
          ) : blueprint?.isPublished ? (
            <div className="prose prose-sm max-w-none text-neutral-800">
              <Markdown>{spec}</Markdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <Lock className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-700">Nothing published yet.</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                The public domain spec is a frozen copy of the build plan. Publishing is only possible once
                every agent's plan is approved, so a half-built plan can never be handed out as final.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => void navigator.clipboard.writeText(tab === 'spec' ? spec : blueprint?.markdown ?? '')}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Markdown
            </button>
            <button
              onClick={() =>
                download(
                  tab === 'spec' ? 'domain-spec.md' : 'build-plan.md',
                  tab === 'spec' ? spec : blueprint?.markdown ?? '',
                )
              }
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
          <button
            onClick={() => void handlePublish()}
            disabled={!isFinal || isPublishing}
            title={isFinal ? 'Freeze this plan as the public domain spec' : 'Available once every agent is approved'}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Send className={cn('w-3.5 h-3.5', isPublishing && 'animate-pulse')} />
            {isPublishing ? 'Publishing…' : blueprint?.isPublished ? 'Republish Domain Spec' : 'Publish Domain Spec'}
          </button>
        </div>
      </div>
    </div>
  );
}
